/**
 * Shared SQL for Azure Blob Storage examples.
 */

export const AZURE_BLOB_URL =
  "az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/puYear=*/puMonth=1/*.parquet";

export const INSTALL_AZURE = "INSTALL azure";

export const LOAD_AZURE = "LOAD azure";

export const SET_AZURE_CONNECTION_STRING = "SET azure_storage_connection_string = ''";

export const SET_AZURE_TRANSPORT_TYPE = "SET azure_transport_option_type = 'curl'";

export const SAMPLE_QUERY = `
SELECT
  vendorID AS vendor_id,
  tpepPickupDateTime AS pickup_datetime,
  tpepDropoffDateTime AS dropoff_datetime,
  passengerCount AS passenger_count,
  tripDistance AS trip_distance,
  puLocationId AS pickup_location_id
FROM read_parquet('${AZURE_BLOB_URL}')
LIMIT 10
`;
