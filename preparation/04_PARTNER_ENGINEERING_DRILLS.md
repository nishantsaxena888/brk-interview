# 04. Partner Engineering & Live Scenario Drills
**Role**: Python Engineer (Data Platform Engineering)  
**Focus**: The partner-facing technical ownership and incident drills that the JD heavily prioritizes.

---

## 🚨 Drill 1: "A partner silently changed their schema at 2 AM, breaking 500 dealers. Walk me through your triage."

### The Response Structure (Triage $\to$ Quarantine $\to$ Diff $\to$ Fix $\to$ Replay):
1. **Immediate Quarantine & Alerting (Containment)**:
   - "Because we validate boundary contracts using strict Pydantic/JSON Schema, downstream systems don't crash with cryptic KeyError exceptions."
   - "Failing payloads are automatically diverted to `s3://data-lake/quarantine/tenant_id=XYZ/partner=tekion/`."
   - "CloudWatch Metric Alarms on validation error rates trigger a PagerDuty alert."
2. **Diagnostic Diffing (Root Cause)**:
   - "I inspect the quarantined payload JSON and run an automated schema diff against our registered Pydantic model using Claude or a quick diff script."
   - "For example: The partner renamed `buyer_zip` to `postal_code`, or converted an integer timestamp to an ISO-8601 string."
3. **Hotfix & Deploy**:
   - "Update the partner-specific Pydantic adapter with a field alias or union: `buyer_zip: str = Field(alias='postal_code')`."
   - "Run the contract test suite locally and deploy via CI/CD CDK pipeline."
4. **Replay from S3 Landing**:
   - "Once deployed, I trigger the event replay script to re-drive all quarantined and landing payloads through the normalization pipeline. All 500 dealers are reconciled without asking the partner to re-send."
5. **Partner Escalation**:
   - "Open a high-priority ticket with the partner's technical contact referencing their API versioning agreement and providing the exact timestamped traces."

---

## 🤝 Drill 2: "The partner's sandbox works, but production traffic is failing. How do you handle it?"

### The Response:
1. **Never Assume Parity**:
   - "Sandboxes frequently have relaxed rate limits, synthetic test data that ignores required validation, or run on older release builds than production."
2. **Evidence-Based Engagement**:
   - "Capture the exact HTTP request/response pairs in production, including request IDs, TLS negotiation headers, and status codes."
   - "Sanitize any dealer PII and share the trace with the partner's integration engineer."
3. **Live Technical Call**:
   - "Get on a 15-minute screen-share call with their engineer. Show them: 'Here is what your documentation specified, here is what your sandbox returned, and here is what your production endpoint is returning with trace ID XYZ.'"
   - "Agree on whether this is an unintended bug on their side or an unannounced production rollout, and adjust our client adapters accordingly."

---

## ⚡ Drill 3: "How do you leverage Claude / AI daily to onboard partners at a pace competitors can't match?"

### The Response (Specific, Concrete Workflows):
1. **Spec to Typed Client Skeletons**:
   - "When a partner sends a 50-page PDF or a complex OpenAPI/WSDL specification, I use Claude to generate the initial typed Pydantic v2 data models and `httpx` async client boilerplate in minutes."
2. **Automated Contract Test Generation**:
   - "I feed sample payloads into Claude to generate randomized edge-case fixtures (null values, missing keys, extreme numbers) for our pytest contract suite."
3. **Spec Version Diffing**:
   - "When a partner releases API v2.3, I diff the new spec against v2.2 with Claude to immediately flag breaking contract changes (renamed fields, altered enums, stricter constraints)."
4. **Log & Trace Reasoning**:
   - "During production outages, I pipe structured CloudWatch logs and JSON stack traces to Claude to rapidly isolate whether a 500 error originated from our normalization logic or the vendor's upstream response."

---

## 🛡️ Drill 4: "A partner's endpoint is returning HTTP 429 Rate Limit. How do you handle it without dropping dealer data?"

### The Response:
1. **Inspect Response Headers**:
   - Check if the partner sends `Retry-After` or `X-RateLimit-Reset`. If present, honor that timestamp explicitly.
2. **Client-Side Token Bucket**:
   - Implement a distributed token-bucket rate limiter in DynamoDB or Redis per partner, throttling requests to 80% of their documented ceiling.
3. **Exponential Backoff with Full Jitter**:
   - To avoid thundering herd issues, sleep for `random.uniform(0, 2 ** attempt)`.
4. **SQS Buffering**:
   - Queue outgoing messages in Amazon SQS. Throttle Lambda event source mapping batch sizes and maximum concurrency so outbound traffic smoothly matches the partner's throughput limit.
