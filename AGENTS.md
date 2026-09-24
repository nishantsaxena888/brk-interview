#BRKInterviewPreparation&EngineeringGuidelines

Thisrepositorycontainsinterviewpreparationmaterials,jobdescriptions,technicalspecifications,andarchitecturalreferencesforthe**PythonEngineer(DataPlatformEngineering)**position.

##🎯RoleContext&ArchitectureStack
-**Domain**:Multi-TenantAutomotiveSaaSPlatform(5,000+DealerGroups,40+PartnerIntegrationsacrossDMS,CRM,DigitalRetail,F&I).
-**CoreTechnologyStack**:
-**Languages**:ModernPython(AWSLambdaPowertools,Pydanticv2,JSONSchema).
-**AWSServerless(NAWS)**:Lambda,EventBridge,StepFunctions,SQS,APIGateway,DynamoDB(Single-TableDesign),S3DataLake(MedallionArchitecture:Landing->Bronze->Silver->Gold),SecretsManager,SSM,KMS,ECSFargate,AuroraMySQL.
-**AI&Multi-Agent**:AWSBedrock,AgentCoreRuntime,StrandsAgentScaffolding,BedrockGuardrails(PIIprotection,tenantisolation),BedrockEvaluations.
-**InfrastructureasCode**:AWSCDK(Python/TypeScript).
-**Observability**:OpenTelemetrytracingintoAWSCloudWatchwithrecord-leveldatalineage.

---

##📜RepositoryRules&Guidelines

1.**Code&ScriptQuality**:
-Writeclean,modernPythonusingtypehints(`typing`)andexpliciterrorhandling.
-AllexternalpayloadvalidationsmustusestrictJSONSchemaorPydanticmodelsatsystemboundaries.
-Neverhardcodecredentials;alwaysreferenceAWSSecretsManagerorParameterStore.

2.**InterviewStrategy&STARMapping**:
-Everytechnicalanswershouldconnectreal-worldexperience(suchasthehigh-scale`Reconciliation Engine`reconciliationengine)withthe`jd.txt`and`about.txt`architecturerequirements.
-Emphasize**resilienceunderscale**,**multi-tenantrow-leveldataisolation**,and**idempotenteventprocessing**.

3.**DocumentationIntegrity**:
-Keepmarkdowndocumentationformattedwithclearheaders,tables,andMermaiddiagramswhereapplicable.
-Maintainclickablefilelinks(`file:///...`)whenlinkingcodebaseartifacts.

4.**AIAgentCollaboration&Portability**:
-AllAIagents(AntigravityIDE,subagents,ClaudeCode,orCLIrunners)operatingwithinthisrepositoryMUSTautomaticallyread,inherit,andenforcetherulesin`AGENTS.md`andskillsin`.agents/skills/`.
-Keep`.agents/`synchronizedwithremote`main`soallteammembersandagentsoperatewithidenticalarchitecturalstandardsandinterviewprepSTARrunbooks.

