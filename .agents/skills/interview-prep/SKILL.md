---
name:interview-prep
description:>-
Comprehensiveguideandrunbookforpracticinginterviewquestions,STARstories,
systemdesignscenarios,andtechnicaldeep-divesforthePythonEngineerrole.
---

#InterviewPreparationSkill(`interview-prep`)

Thisskillprovidesastructuredframeworkforpracticingtechnicalinterviewtopics,STARstorymappings,andsystemdesignchallengesfortheAutomotiveSaaS/DataPlatformposition.

---

##🧭CoreCompetencyModules

###Module1:`Reconciliation Engine`to`jd.txt`/`about.txt`STARMapping
Whenaskedaboutpriorhigh-scalePythonorintegrationexperience,usethe**`Reconciliation Engine`STARframework**:

***Situation**:SalesforcetoNovasysmigrationrequiredverifying100,000+subscriber,agent,andpolicyenrollmentrecordsagainstPostgreSQLwithoutcausingOOMcrashesorserverlag.
***Task**:Buildanautomated,memory-safereconciliationenginecapableofhandlingmassiveflat-filedatasetsandcross-validatingrecordsagainstPostgreSQL.
***Action**:
-Builtatwo-phasechunkingexecutionengine(`compare_manager.py`)inPythonwithPandasstreaming(`POLICY_CHUNK_SIZE=10,000`).
-Createddynamicschemanormalizationrulesin`configuration.py`(formattingpolicyIDs,stripping`.0`decimals,normalizingmissingfields).
-ReducedDBloadtoasinglebatchhitperchunkandflushedRAMimmediatelyafterwritingJSONoutputartifacts.
-Builtstandalone,zero-dependencyHTML5/JSdashboardviewsforinstantdeep-divepolicytriage.
***Result**:Reducedvalidationruntimes,achieved100%memorysafety(zeroOOMerrors),andenabledexactpolicyrangesearchbounds(`start_policy`to`end_policy`).

---

##🛠️Module2:SystemDesignQuestions&CheatSheet

###1.HowdoyouensureIdempotencyinanEvent-DrivenWebhookReceiver?
-**Pattern**:`EventBridge`+`Lambda`+`DynamoDB`single-tablelock.
-**Mechanism**:
1.WebhookhitsAPIGateway;Lambdaextractsuniqueeventsignature/ID(e.g.`X-Webhook-ID`orpayloadhash).
2.Performaconditional`PutItem`inDynamoDBwith`attribute_not_exists(id)`andaTTL(e.g.,24hours).
3.Ifitemexists(`ConditionalCheckFailedException`),acknowledgewith`200OK`(duplicateignored).
4.Ifnew,processeventandupdatestatusto`PROCESSED`.

###2.HowdoyouenforceMulti-TenantIsolationinaMedallionS3DataLake?
-**Pattern**:Prefix-basedtenantpartitioning(`s3://bucket/landing/tenant_id=XYZ/year=2026/`).
-**IAMEnforcement**:ABAC(Attribute-BasedAccessControl)usingIAMpolicyvariable`${aws:PrincipalTag/TenantId}`.
-**AgentRetrieval**:AgentCoreRuntimeappends`WHEREtenant_id=:tenant_id`attheSQL/QuerylayerforeveryDMSandCRMquery.

---

##🧪Module3:PracticeCommands&Execution

Togeneratepracticeinterviewquestionsormockinterviews:
1.Review[jd/jd.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/jd.txt)and[jd/about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt).
2.PracticewalkingthroughsystemdesigndiagramsforDMSAgent<->CRMAgentorchestration.
