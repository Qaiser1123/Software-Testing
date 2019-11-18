import { Lexer, Parser, getImage } from "chevrotain";

import _ from "underscore";
import { t } from "ttag";
import {
  // aggregations:
  formatAggregationName,
  getAggregationFromName,
  // dimensions:
  getDimensionFromName,
  getDimensionName,
  formatDimensionName,
} from "../expressions";

import {
  allTokens,
  LParen,
  RParen,
  AdditiveOperator,
  MultiplicativeOperator,
  Aggregation,
  NullaryAggregation,
  UnaryAggregation,
  StringLiteral,
  NumberLiteral,
  Minus,
  Identifier,
} from "./tokens";

import { ExpressionDimension } from "metabase-lib/lib/Dimension";

const ExpressionsLexer = new Lexer(allTokens);

class ExpressionsParser extends Parser {
  constructor(input, options = {}) {
    const parserOptions = {
      // recoveryEnabled: false,
      ignoredIssues: {
        // uses GATE to disambiguate fieldName and metricName
        atomicExpression: { OR1: true },
      },
    };
    super(input, allTokens, parserOptions);

    const $ = this;

    this._options = options;

    // an expression without aggregations in it
    $.RULE("expression", function(outsideAggregation = false) {
      return $.SUBRULE($.additionExpression, [outsideAggregation]);
    });

    // an expression with aggregations in it
    $.RULE("aggregation", function() {
      return $.SUBRULE($.additionExpression, [true]);
    });

    // Lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by
    // how far down the Parse Tree the binary expression appears.
    $.RULE("additionExpression", outsideAggregation => {
      const initial = $.SUBRULE($.multiplicationExpression, [
        outsideAggregation,
      ]);
      const operations = $.MANY(() => {
        const op = $.CONSUME(AdditiveOperator);
        const rhsVal = $.SUBRULE2($.multiplicationExpression, [
          outsideAggregation,
        ]);
        return [op, rhsVal];
      });
      return this._math(initial, operations);
    });

    $.RULE("multiplicationExpression", outsideAggregation => {
      const initial = $.SUBRULE($.atomicExpression, [outsideAggregation]);
      const operations = $.MANY(() => {
        const op = $.CONSUME(MultiplicativeOperator);
        const rhsVal = $.SUBRULE2($.atomicExpression, [outsideAggregation]);
        return [op, rhsVal];
      });
      return this._math(initial, operations);
    });

    $.RULE("nullaryCall", () => {
      return {
        lParen: $.CONSUME(LParen),
        rParen: $.CONSUME(RParen),
      };
    });
    $.RULE("unaryCall", () => {
      return {
        lParen: $.CONSUME(LParen),
        arg: $.SUBRULE($.expression, [false]),
        rParen: $.CONSUME(RParen),
      };
    });

    $.RULE("aggregationExpression", outsideAggregation => {
      const { aggregation, lParen, arg, rParen } = $.OR([
        {
          ALT: () => ({
            aggregation: $.CONSUME(NullaryAggregation),
            ...$.OPTION(() => $.SUBRULE($.nullaryCall)),
          }),
        },
        {
          ALT: () => ({
            aggregation: $.CONSUME(UnaryAggregation),
            ...$.SUBRULE($.unaryCall),
          }),
        },
      ]);
      return this._aggregation(aggregation, lParen, arg, rParen);
    });

    $.RULE("metricExpression", () => {
      const metricName = $.OR([
        { ALT: () => $.SUBRULE($.stringLiteral) },
        { ALT: () => $.SUBRULE($.identifier) },
      ]);

      const metric = this.getMetricForName(this._toString(metricName));
      if (metric != null) {
        return this._metricReference(metricName, metric.id);
      }
      return this._unknownMetric(metricName);
    });

    $.RULE("dimensionExpression", () => {
      const dimensionName = $.OR([
        { ALT: () => $.SUBRULE($.stringLiteral) },
        { ALT: () => $.SUBRULE($.identifier) },
      ]);

      const dimension = this.getDimensionForName(this._toString(dimensionName));
      if (dimension != null) {
        return this._dimensionReference(dimensionName, dimension);
      }
      return this._unknownField(dimensionName);
    });

    $.RULE("identifier", () => {
      const identifier = $.CONSUME(Identifier);
      return this._identifier(identifier);
    });

    $.RULE("stringLiteral", () => {
      const stringLiteral = $.CONSUME(StringLiteral);
      return this._stringLiteral(stringLiteral);
    });

    $.RULE("numberLiteral", () => {
      const minus = $.OPTION(() => $.CONSUME(Minus));
      const numberLiteral = $.CONSUME(NumberLiteral);
      return this._numberLiteral(minus, numberLiteral);
    });

    $.RULE("atomicExpression", outsideAggregation => {
      return $.OR(
        [
          // aggregations are not allowed inside other aggregations
          {
            GATE: () => outsideAggregation,
            ALT: () => $.SUBRULE($.aggregationExpression, [false]),
          },

          // NOTE: DISABLE METRICS
          // {GATE: () => outsideAggregation, ALT: () => $.SUBRULE($.metricExpression) },

          // dimensions are not allowed outside aggregations
          {
            GATE: () => !outsideAggregation,
            ALT: () => $.SUBRULE($.dimensionExpression),
          },

          {
            ALT: () => $.SUBRULE($.parenthesisExpression, [outsideAggregation]),
          },
          { ALT: () => $.SUBRULE($.numberLiteral) },
        ],
        outsideAggregation
          ? "aggregation, number, or expression"
          : "field name, number, or expression",
      );
    });

    $.RULE("parenthesisExpression", outsideAggregation => {
      const lParen = $.CONSUME(LParen);
      const expValue = $.SUBRULE($.expression, [outsideAggregation]);
      const rParen = $.CONSUME(RParen);
      return this._parens(lParen, expValue, rParen);
    });

    Parser.performSelfAnalysis(this);
  }

  getDimensionForName(dimensionName) {
    return getDimensionFromName(dimensionName, this._options.query);
  }

  getMetricForName(metricName) {
    return this._options.query
      .table()
      .metrics.find(
        metric => metric.name.toLowerCase() === metricName.toLowerCase(),
      );
  }
}

class ExpressionsParserMBQL extends ExpressionsParser {
  _math(initial, operations) {
    for (const [op, rhsVal] of operations) {
      // collapse multiple consecutive operators into a single MBQL statement
      if (Array.isArray(initial) && initial[0] === op.image) {
        initial.push(rhsVal);
      } else {
        initial = [op.image, initial, rhsVal];
      }
    }
    return initial;
  }
  _aggregation(aggregation, lParen, arg, rParen) {
    const agg = getAggregationFromName(getImage(aggregation));
    return arg == null ? [agg] : [agg, arg];
  }
  _metricReference(metricName, metricId) {
    return ["metric", metricId];
  }
  _dimensionReference(dimensionName, dimension) {
    return dimension.mbql();
  }
  _unknownField(fieldName) {
    throw new Error('Unknown field "' + fieldName + '"');
  }
  _unknownMetric(metricName) {
    throw new Error('Unknown metric "' + metricName + '"');
  }

  _identifier(identifier) {
    return identifier.image;
  }
  _stringLiteral(stringLiteral) {
    return JSON.parse(stringLiteral.image);
  }
  _numberLiteral(minus, numberLiteral) {
    return parseFloat(numberLiteral.image) * (minus ? -1 : 1);
  }
  _parens(lParen, expValue, rParen) {
    return expValue;
  }
  _toString(x) {
    return x;
  }
}

const syntax = (type, ...children) => ({
  type: type,
  children: children.filter(child => child),
});
const token = token =>
  token && {
    type: "token",
    text: token.image,
    start: token.startOffset,
    end: token.endOffset,
  };

class ExpressionsParserSyntax extends ExpressionsParser {
  _math(initial, operations) {
    return syntax(
      "math",
      ...[initial].concat(...operations.map(([op, arg]) => [token(op), arg])),
    );
  }
  _aggregation(aggregation, lParen, arg, rParen) {
    return syntax(
      "aggregation",
      token(aggregation),
      token(lParen),
      arg,
      token(rParen),
    );
  }
  _metricReference(metricName, metricId) {
    return syntax("metric", metricName);
  }
  _dimensionReference(dimensionName, dimension) {
    return syntax("field", dimensionName);
  }
  _unknownField(fieldName) {
    return syntax("unknown", fieldName);
  }
  _unknownMetric(metricName) {
    return syntax("unknown", metricName);
  }

  _identifier(identifier) {
    return syntax("identifier", token(identifier));
  }
  _stringLiteral(stringLiteral) {
    return syntax("string", token(stringLiteral));
  }
  _numberLiteral(minus, numberLiteral) {
    return syntax("number", token(minus), token(numberLiteral));
  }
  _parens(lParen, expValue, rParen) {
    return syntax("group", token(lParen), expValue, token(rParen));
  }
  _toString(x) {
    if (typeof x === "string") {
      return x;
    } else if (x.type === "string") {
      return JSON.parse(x.children[0].text);
    } else if (x.type === "identifier") {
      return x.children[0].text;
    }
  }
}

function getSubTokenTypes(TokenClass) {
  return TokenClass.extendingTokenTypes.map(tokenType =>
    _.findWhere(allTokens, { tokenType }),
  );
}

function getTokenSource(TokenClass) {
  // strip regex escaping, e.x. "\+" -> "+"
  return TokenClass.PATTERN.source.replace(/^\\/, "");
}

function run(Parser, source, options) {
  if (!source) {
    return [];
  }
  const { startRule } = options;
  const parser = new Parser(ExpressionsLexer.tokenize(source).tokens, options);
  const expression = parser[startRule]();
  if (parser.errors.length > 0) {
    for (const error of parser.errors) {
      // clean up error messages
      error.message =
        error.message &&
        error.message
          .replace(/^Expecting:?\s+/, "Expected ")
          .replace(/--> (.*?) <--/g, "$1")
          .replace(/(\n|\s)*but found:?/, " but found ")
          .replace(/\s*but found\s+''$/, "");
    }
    throw parser.errors;
  }
  return expression;
}

export function compile(source, options = {}) {
  return run(ExpressionsParserMBQL, source, options);
}

export function parse(source, options = {}) {
  return run(ExpressionsParserSyntax, source, options);
}

// No need for more than one instance.
const parserInstance = new ExpressionsParser([]);
export function suggest(
  source,
  { query, startRule, index = source.length, expressionName } = {},
) {
  const partialSource = source.slice(0, index);
  const lexResult = ExpressionsLexer.tokenize(partialSource);
  if (lexResult.errors.length > 0) {
    throw new Error(t`sad sad panda, lexing errors detected`);
  }

  const lastInputToken = _.last(lexResult.tokens);
  let partialSuggestionMode = false;
  let assistanceTokenVector = lexResult.tokens;

  // we have requested assistance while inside an Identifier
  if (
    lastInputToken instanceof Identifier &&
    /\w/.test(partialSource[partialSource.length - 1])
  ) {
    assistanceTokenVector = assistanceTokenVector.slice(0, -1);
    partialSuggestionMode = true;
  }

  let finalSuggestions = [];

  // TODO: is there a better way to figure out which aggregation we're inside of?
  const currentAggregationToken = _.find(
    assistanceTokenVector.slice().reverse(),
    t => t instanceof Aggregation,
  );

  const syntacticSuggestions = parserInstance.computeContentAssist(
    startRule,
    assistanceTokenVector,
  );
  for (const suggestion of syntacticSuggestions) {
    const { nextTokenType, ruleStack } = suggestion;
    // no nesting of aggregations or field references outside of aggregations
    // we have a predicate in the grammar to prevent nested aggregations but chevrotain
    // doesn't support predicates in content-assist mode, so we need this extra check
    const outsideAggregation =
      startRule === "aggregation" &&
      ruleStack.slice(0, -1).indexOf("aggregationExpression") < 0;

    if (
      nextTokenType === MultiplicativeOperator ||
      nextTokenType === AdditiveOperator
    ) {
      const tokens = getSubTokenTypes(nextTokenType);
      finalSuggestions.push(
        ...tokens.map(token => ({
          type: "operators",
          name: getTokenSource(token),
          text: " " + getTokenSource(token) + " ",
          prefixTrim: /\s*$/,
          postfixTrim: /^\s*[*/+-]?\s*/,
        })),
      );
    } else if (nextTokenType === LParen) {
      finalSuggestions.push({
        type: "other",
        name: "(",
        text: " (",
        postfixText: ")",
        prefixTrim: /\s*$/,
        postfixTrim: /^\s*\(?\s*/,
      });
    } else if (nextTokenType === RParen) {
      finalSuggestions.push({
        type: "other",
        name: ")",
        text: ") ",
        prefixTrim: /\s*$/,
        postfixTrim: /^\s*\)?\s*/,
      });
    } else if (
      nextTokenType === Identifier ||
      nextTokenType === StringLiteral
    ) {
      if (!outsideAggregation) {
        let dimensions = [];
        if (startRule === "aggregation" && currentAggregationToken) {
          const aggregationShort = getAggregationFromName(
            getImage(currentAggregationToken),
          );
          dimensions = query.aggregationFieldOptions(aggregationShort).all();
        } else if (startRule === "expression") {
          dimensions = query
            .dimensionOptions(
              d =>
                // numeric
                d.field().isNumeric() &&
                // not itself
                !(
                  d instanceof ExpressionDimension &&
                  d.name() === expressionName
                ),
            )
            .all();
        }
        finalSuggestions.push(
          ...dimensions.map(dimension => ({
            type: "fields",
            name: getDimensionName(dimension),
            text: formatDimensionName(dimension) + " ",
            prefixTrim: /\w+$/,
            postfixTrim: /^\w+\s*/,
          })),
        );
      }
    } else if (
      nextTokenType === Aggregation ||
      nextTokenType === NullaryAggregation ||
      nextTokenType === UnaryAggregation ||
      nextTokenType === Identifier ||
      nextTokenType === StringLiteral
    ) {
      if (outsideAggregation) {
        finalSuggestions.push(
          ...query
            .aggregationOperatorsWithoutRows()
            .filter(a => formatAggregationName(a))
            .map(aggregationOperator => {
              const arity = aggregationOperator.fields.length;
              return {
                type: "aggregations",
                name: formatAggregationName(aggregationOperator),
                text:
                  formatAggregationName(aggregationOperator) +
                  (arity > 0 ? "(" : " "),
                postfixText: arity > 0 ? ")" : " ",
                prefixTrim: /\w+$/,
                postfixTrim: arity > 0 ? /^\w+(\(\)?|$)/ : /^\w+\s*/,
              };
            }),
        );
        // NOTE: DISABLE METRICS
        // finalSuggestions.push(...tableMetadata.metrics.map(metric => ({
        //     type: "metrics",
        //     name: metric.name,
        //     text: formatMetricName(metric),
        //     prefixTrim: /\w+$/,
        //     postfixTrim: /^\w+\s*/
        // })))
      }
    } else if (nextTokenType === NumberLiteral) {
      // skip number literal
    } else {
      console.warn("non exhaustive match", nextTokenType.name, suggestion);
    }
  }

  // throw away any suggestion that is not a suffix of the last partialToken.
  if (partialSuggestionMode) {
    const partial = getImage(lastInputToken).toLowerCase();
    for (const suggestion of finalSuggestions) {
      suggestion: for (const text of [suggestion.name, suggestion.text]) {
        let index = 0;
        for (const part of (text || "").toLowerCase().split(/\b/g)) {
          if (part.startsWith(partial)) {
            suggestion.range = [index, index + partial.length];
            break suggestion;
          }
          index += part.length;
        }
      }
    }
    finalSuggestions = finalSuggestions.filter(suggestion => suggestion.range);
  }
  for (const suggestion of finalSuggestions) {
    suggestion.index = index;
    if (!suggestion.name) {
      suggestion.name = suggestion.text;
    }
  }

  // deduplicate suggestions and sort by type then name
  return _.chain(finalSuggestions)
    .uniq(suggestion => suggestion.text)
    .sortBy("name")
    .sortBy("type")
    .value();
}
