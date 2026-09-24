#Requirement&AgentReviewSpecification(`requirement.md`)

ThisfileisastandalonespecificationintendedforAIagents(Claude,ChatGPT,Antigravity,orpeerreviewers)toevaluatecandidatealignment,suggestresumerefinements,critiqueclientcovernotes,andgenerateinterviewquestionsforthe**PythonEngineer(DataPlatformEngineering)**position.

---

##🎯1.TargetRole&JobRequirements(FromClientJD&ArchitectureSpec)

###RoleProfile
***Title**:PythonEngineer(DataPlatformEngineering)—Multi-TenantAutomotiveSaaS
***Scale**:5,000+DealerGroups,40+PartnerSystems(DMSplatformslikeCDK,Reynolds&Reynolds,Tekion,DealerTrack,Procede;CRMs;DigitalRetail;F&I;Lenders).
***CoreFunction**:Ownend-to-endpartneringestionpipelines(REST,SOAP/XML,Webhooks,SFTPfilefeeds)landingintoan**S3MedallionDataLake**(`Landing`→`Bronze`→`Silver`→`Gold`).

###KeyTechnicalRequirements
1.**Python&AWSServerless**:ModernPython(AWSLambdaPowertools,Pydanticv2,JSONSchema),Lambda,EventBridge,StepFunctions,DynamoDB(Single-TableDesign&deduplicationlocks),SQS,APIGateway,AWSCDK.
2.**IntegrationProtocols&Resilience**:WebhookHMACSHA256verification,mTLS,replayprotection,exponentialbackoff,ratelimiting,andcontracttesting.
3.**Multi-Tenancy**:OAuth2viaAuth0,strictrow-leveltenantdataisolationenforcedoneverycall(`tenant_id`propagation).
4.**AWSBedrock&Multi-AgentArchitecture**(From`about.txt`Phase1Scope):
-**StrandsAgentScaffolding**&**AgentCoreRuntime**.
-SynchronousMulti-AgentOrchestratorroutingbetween**DMSAgent**&**CRMAgent**.
-**AWSBedrock(Claude3.5)**&**BedrockGuardrails**(PIImasking,allowedtopics,tenantisolation).
-**AgentCoreMemory**(session&long-termtenant-namespacedmemory).
-**OpenTelemetry(OTel)**tracingintoCloudWatchwithrecord-leveldatalineage(`tenant_id`,`latency`,`cost`,`retrievalrecordIDs`).

---

##🔬2.Candidate'sActualHands-OnExperience&LastProjectDetails

###A.LastProject:Centene(Nov2025–Present)—*ReconciliationEngine(`Reconciliation Engine`)*
***Context**:DecommissioninglegacyNovasysarchitecturetotransitionintoSalesforce.
***CoreBuild(`Reconciliation Engine`)**:
-Engineeredatwo-phaseflat-filechunkingexecutionengine(`compare_manager.py`)inPythontovalidate**100,000+migratedpolicy,subscriber,andagentrecords**againstPostgreSQL.
-Implementedamemory-safechunkingpipeline(`POLICY_CHUNK_SIZE=10,000`)usingPandasstreaming,achieving**zeroOut-Of-Memory(OOM)errors**understrictserverconstraints.
-Createddynamicschemanormalizationrulesin`configuration.py`(stripping`.0`trailingdecimals,uppercasingIDs,handlingmissingfieldfallbacks).
-RestrictedDBaccessto**1singlebatchhitperchunk**,avoidingqueryspikesonproductiondatabases.
-Developedareal-timevisualcomparisondashboardusingtheUniverJSframeworkandalocalSQLitemonitoringdaemononRHEL.
-RefactoredlegacyCeleryasynchronousconsumersacrossbrokerandpaymentfeeds.

###B.CapitalOne(Apr2024–Sep2024)—*ServerlessTransactionOrchestrator*
-Builttransactionlifecycleorchestrationusing**AWSStepFunctions**,**LambdaPowertools**,**EventBridge**,and**DynamoDBdeduplicationlocks**.
-ImplementedTDDtestsuiteswithLocalStackandwrote100%ofinfrastructureascodeusing**AWSCDK**.

###C.KKR&MindMasterSolutions(2022–2025)—*AWSBedrock&DocumentAI*
-BuiltAWSBedrock(Claude3.5)promptextractionworkflowsconvertingunstructuredfinancialsheetsintostructuredJSONmodels.
-DevelopedfinancialRAGpipelinesusingElasticsearchdensevectorsearchandFastAPI.
-BuiltdocumentprocessingpipelinesusingAWSTextract,S3MedallionLake,andKubernetesEKS.

---

##📄3.DraftClientSubmissionMaterials(ForAgentReview&Suggestion)

###ClientEmailDraft
>**Subject**:Application&TechnicalExperienceOverview—SeniorPythonDataPlatform&AWSAIEngineer
>
>Hi[HiringManager/RecruiterName],
>
>Iamwritingtoexpressmystronginterestinthe**PythonEngineer(DataPlatformEngineering)**position.Withover17yearsofexperiencebuildinghigh-throughputPythondatapipelines,AWSserverlessmicroservices,andmulti-agentAIsystems,Iamexcitedabouttheopportunitytoownyourpartnerintegrationplatform.
>
>Inmymostrecentroleat**Centene**,Iengineeredahigh-scale**Python/DjangoDataReconciliationEngine(`Reconciliation Engine`)**validating**100,000+policyrecords**usingamemory-safeflat-filechunkingengine(`POLICY_CHUNK_SIZE=10,000`),Pandasstreaming,andsingle-queryDBbatchhitsunderstrictRAMlimits.
>
>Beyonddataplatformengineering,Ihaveextensiveexperiencebuildingmulti-agentAIsystemsusing**AWSBedrock(Claude3.5)**,**StrandsAgentScaffolding**,**AgentCoreRuntime**,**BedrockGuardrails**,**AgentCoreMemory**,and**OpenTelemetryCloudWatchlineage**.
>
>IwelcometheopportunitytodiscusshowmybackgroundinPythoningestion,AWSserverlessresilience,andAWSBedrockmulti-agentarchitecturescandriveimmediatevalueforyourteam.

---

##🤖4.InstructionsfortheReviewingAIAgent

IfyouareanAIagentreadingthisfile,pleaseprovidefeedbackon:
1.**Resume&ExperienceAlignment**:Arethereanygapsbetweenthecandidate's`Reconciliation Engine`/CapitalOneexperienceandtheAutomotiveSaaSrequirements?
2.**ClientEmailOptimization**:Howcantheemaildraftbemadeevenpunchierfortechnicalhiringmanagers?
3.**TechnicalInterviewQuestions**:Whatspecificsystemdesignorcodingquestionsshouldbeaskedtotestthecandidateon**AWSBedrock**,**Strandsscaffolding**,**LambdaPowertools**,**S3medallionlakes**,and**webhookidempotency**?
