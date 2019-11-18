/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";

import { Box } from "grid-styled";
import StepTitle from "./StepTitle";
import CollapsedStep from "./CollapsedStep";

import DatabaseDetailsForm from "metabase/components/DatabaseDetailsForm";
import FormField from "metabase/components/form/FormField";
import MetabaseAnalytics from "metabase/lib/analytics";
import MetabaseSettings from "metabase/lib/settings";

import _ from "underscore";
import { DEFAULT_SCHEDULES } from "metabase/admin/databases/database";

export default class DatabaseConnectionStep extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { engine: "", formError: null };
  }

  static propTypes = {
    stepNumber: PropTypes.number.isRequired,
    activeStep: PropTypes.number.isRequired,
    setActiveStep: PropTypes.func.isRequired,

    databaseDetails: PropTypes.object,
    validateDatabase: PropTypes.func.isRequired,
    setDatabaseDetails: PropTypes.func.isRequired,
  };

  chooseDatabaseEngine = e => {
    const engine = e.target.value;

    this.setState({
      engine: engine,
    });

    MetabaseAnalytics.trackEvent("Setup", "Choose Database", engine);
  };

  connectionDetailsCaptured = async database => {
    this.setState({
      formError: null,
    });

    // make sure that we are trying ssl db connections to start with
    database.details.ssl = true;

    try {
      // validate the details before we move forward
      await this.props.validateDatabase(database);
    } catch (error) {
      let formError = error;
      database.details.ssl = false;

      try {
        // ssl connection failed, lets try non-ssl
        await this.props.validateDatabase(database);

        formError = null;
      } catch (error2) {
        formError = error2;
      }

      if (formError) {
        MetabaseAnalytics.trackEvent(
          "Setup",
          "Error",
          "database validation: " + this.state.engine,
        );

        this.setState({
          formError: formError,
        });

        return;
      }
    }

    if (database.details["let-user-control-scheduling"]) {
      // Show the scheduling step if user has chosen to control scheduling manually
      // Add the default schedules because DatabaseSchedulingForm requires them and update the db state
      this.props.setDatabaseDetails({
        nextStep: this.props.stepNumber + 1,
        details: {
          ...database,
          is_full_sync: true,
          schedules: DEFAULT_SCHEDULES,
        },
      });
    } else {
      // now that they are good, store them
      this.props.setDatabaseDetails({
        // skip the scheduling step
        nextStep: this.props.stepNumber + 2,
        details: database,
      });

      MetabaseAnalytics.trackEvent("Setup", "Database Step", this.state.engine);
    }
  };

  skipDatabase() {
    this.setState({
      engine: "",
    });

    this.props.setDatabaseDetails({
      nextStep: this.props.stepNumber + 2,
      details: null,
    });

    MetabaseAnalytics.trackEvent("Setup", "Database Step");
  }

  renderEngineSelect() {
    const engines = MetabaseSettings.get("engines");
    const { engine } = this.state;
    const engineNames = _.keys(engines).sort();

    return (
      <label className="Select mt1">
        <select defaultValue={engine} onChange={this.chooseDatabaseEngine}>
          <option value="">{t`Select the type of Database you use`}</option>
          {engineNames.map(opt => (
            <option key={opt} value={opt}>
              {engines[opt]["driver-name"]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  render() {
    const {
      activeStep,
      databaseDetails,
      setActiveStep,
      stepNumber,
    } = this.props;
    const { engine, formError } = this.state;
    const engines = MetabaseSettings.get("engines");

    let stepText = t`Add your data`;
    if (activeStep > stepNumber) {
      stepText =
        databaseDetails === null
          ? t`I'll add my own data later`
          : t`Connecting to ${databaseDetails.name}`;
    }

    if (activeStep !== stepNumber) {
      return (
        <CollapsedStep
          stepNumber={stepNumber}
          stepCircleText="2"
          stepText={stepText}
          isCompleted={activeStep > stepNumber}
          setActiveStep={setActiveStep}
        />
      );
    } else {
      return (
        <Box
          p={4}
          className="SetupStep bg-white rounded full relative SetupStep--active"
        >
          <StepTitle title={stepText} circleText={"2"} />
          <div className="mb4">
            <div style={{ maxWidth: 600 }} className="Form-field">
              {t`You’ll need some info about your database, like the username and password. If you don’t have that right now, Metabase also comes with a sample dataset you can get started with.`}
            </div>

            <FormField fieldName="engine">
              {this.renderEngineSelect()}
            </FormField>

            {engine !== "" ? (
              <DatabaseDetailsForm
                details={
                  databaseDetails && "details" in databaseDetails
                    ? {
                        ...databaseDetails.details,
                        name: databaseDetails.name,
                        is_full_sync: databaseDetails.is_full_sync,
                        auto_run_queries: databaseDetails.auto_run_queries,
                      }
                    : null
                }
                engine={engine}
                engines={engines}
                formError={formError}
                hiddenFields={{ ssl: true }}
                submitFn={this.connectionDetailsCaptured}
                submitButtonText={t`Next`}
              />
            ) : null}

            <div className="Form-field mt1">
              <a
                className="link"
                onClick={this.skipDatabase.bind(this)}
              >{t`I'll add my data later`}</a>
            </div>
          </div>
        </Box>
      );
    }
  }
}
