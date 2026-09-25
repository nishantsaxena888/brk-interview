# 03. Python Deep-Dive & Code Patterns
**Role**: Python Engineer (Data Platform Engineering)  
**Tools**: Python 3.12+, Pydantic v2, AWS Lambda Powertools, `httpx`, `boto3`, `zeep`

---

## Pattern 1: Pydantic v2 Discriminated Unions (Polymorphic Partner Ingestion)
> **Use Case**: Ingesting deals from multiple DMS partners (CDK vs. Tekion) into a single boundary router.

```python
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field, TypeAdapter

class CDKDealPayload(BaseModel):
    partner: Literal["cdk"]
    deal_num: str
    vin_number: str
    buyer_last_name: str
    gross_amount_cents: int

class TekionDealPayload(BaseModel):
    partner: Literal["tekion"]
    dealId: str
    vehicleVin: str
    customerName: str
    totalPrice: float

# Discriminated union based on 'partner' field
PartnerDeal = Annotated[
    Union[CDKDealPayload, TekionDealPayload],
    Field(discriminator="partner")
]

adapter = TypeAdapter(PartnerDeal)

def parse_incoming_webhook(raw_json: dict):
    # Automatically validates and instantiates the correct partner class
    deal = adapter.validate_python(raw_json)
    return deal
```

---

## Pattern 2: AWS Lambda Powertools Idempotency with DynamoDB
> **Use Case**: Guaranteeing exactly-once business logic execution in an at-least-once AWS serverless pipeline.

```python
import os
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.idempotency import (
    DynamoDBPersistenceLayer,
    IdempotencyConfig,
    idempotent,
)

logger = Logger()
tracer = Tracer()

# Configure DynamoDB persistence layer with 24-hr TTL
persistence_layer = DynamoDBPersistenceLayer(
    table_name=os.environ["IDEMPOTENCY_TABLE_NAME"],
    key_attr="idempotency_key",
    expiry_attr="expires_at",
)

idempotency_config = IdempotencyConfig(
    event_key_jmespath="[headers.x_webhook_id, body.tenant_id, body.deal_id]",
    expires_after_seconds=86400,  # 24 hours
)

@logger.inject_lambda_context(correlation_id_path="headers.x_correlation_id")
@tracer.capture_lambda_handler
@idempotent(config=idempotency_config, persistence_store=persistence_layer)
def lambda_handler(event: dict, context):
    logger.info("Processing unique partner webhook payload")
    
    # Core business logic: normalize & promote to Bronze/Silver
    return {
        "statusCode": 200,
        "body": '{"status": "PROCESSED"}'
    }
```

---

## Pattern 3: Resilient Async HTTP Polling with Jittered Exponential Backoff
> **Use Case**: Polling external partner REST APIs while strictly honoring rate limits and HTTP 429 headers.

```python
import asyncio
import random
import httpx
from aws_lambda_powertools import Logger

logger = Logger()

async def fetch_partner_page(client: httpx.AsyncClient, url: str, headers: dict, max_retries: int = 5):
    attempt = 0
    while attempt < max_retries:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            # Rate limited
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                if retry_after:
                    wait_time = float(retry_after)
                else:
                    # Exponential backoff with full jitter
                    base_delay = 2 ** attempt
                    wait_time = random.uniform(0, base_delay)
                
                logger.warning(f"Rate limited by partner. Backing off for {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
                attempt += 1
                continue

            response.raise_for_status()
            return response.json()

        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            attempt += 1
            if attempt >= max_retries:
                logger.error(f"Partner API request failed after {max_retries} attempts: {exc}")
                raise
            wait_time = random.uniform(0, 2 ** attempt)
            await asyncio.sleep(wait_time)
```

---

## Pattern 4: Memory-Safe Generator Streaming for Large Datasets (`cent_poc` Pattern)
> **Use Case**: Processing 100,000+ records without OOM by reading and transforming in memory-bounded batches.

```python
import boto3
from typing import Generator, List, Dict

def stream_s3_ndjson_chunks(bucket: str, key: str, chunk_size: int = 10000) -> Generator[List[Dict], None, None]:
    """Streams large JSON lines files from S3 line-by-line in bounded memory chunks."""
    s3_client = boto3.client("s3")
    response = s3_client.get_object(Bucket=bucket, Key=key)
    
    import json
    chunk = []
    
    # line-by-line streaming without buffering entire file in RAM
    for line in response["Body"].iter_lines():
        if line:
            record = json.loads(line.decode("utf-8"))
            chunk.append(record)
            
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []  # Free memory immediately
                
    if chunk:
        yield chunk
```

---

## Pattern 5: Legacy SOAP / WSDL Parsing into Canonical Pydantic Models
> **Use Case**: Handling older DMS systems (CDK / Reynolds) that only expose SOAP/XML endpoints.

```python
import xmltodict
from pydantic import BaseModel, Field

class CanonicalVehicle(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    stock_number: str

def parse_dms_soap_response(soap_xml_string: str) -> CanonicalVehicle:
    # 1. Parse raw XML to dictionary
    parsed_dict = xmltodict.parse(soap_xml_string)
    
    # 2. Extract SOAP envelope payload
    vehicle_raw = parsed_dict["soap:Envelope"]["soap:Body"]["GetVehicleResponse"]["VehicleData"]
    
    # 3. Map to canonical model
    return CanonicalVehicle(
        vin=vehicle_raw["VINNumber"].strip().upper(),
        make=vehicle_raw["MakeName"],
        model=vehicle_raw["ModelName"],
        year=int(vehicle_raw["ModelYear"]),
        stock_number=vehicle_raw["StockId"]
    )
```
