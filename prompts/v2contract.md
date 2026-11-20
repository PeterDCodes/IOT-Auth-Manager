This ticket only will be in the service dir. Any outside scope change must be reviewed
The contract of registering a new device has now changed to match the new seed-v2 schema. This schema will seperate the device information from its authenticated status.

The below is an example of the new expected API contract for registering a device.

POST /register (

{
"x-registration-code": "secret .env code"
}
{
  "name": "MDI-Tablet-1", -required
  "serial_number": "WS-2026-0001", -required
  "mac_addr": "00:1A:2B:3C:4D:5E", -required
  "asset_code": "EAM-15432", -optional
  "type": 12 , -optional (correlates to cd_device_type)
"model": 1 -optional (correlates to cd_device_model)
   "ip": "127.0.0.1" -optional
   "authenticate" : 1 -optional flag
}

The client can register using the same path. However the "authenticate" flag will determine wether or not that device will also be authenticated and writtend to device_authentication table.

if the client puts authenticate:1 (default is blank or any other number) then that device will be authenticated and the response will be the same as current api but instead be the new uuid

Success RES

{
  "message": "Device successfully registered and authenticated",
  "uuid": "6y76-g6y6-yv22-2dct",
  "secret": "one-time-secret"
}

if not flag to authenticate the device will be registered with a basic:
{
  "message": "Device successfully registered"
}


you must also complete the device deployment, device type and model apis. These should be bare minimum following my established design patter and dir and domains folder structure. 


When a  refresh request occurs, the same logic will apply as today however they will instead use the following contract.

POST /refresh

{
  "uuid": the uuid,
  "secret": "one-time-secret"
}

This will then validate and return the standard JWT


Your goal is to review the new SQL data model, update the MD and notes of this project and build a plan to fit this new DB contract. You must ask any required questions to clarify the goal. You must only make the scope changes needed that I request. 

Do not put in any undefiend logic or validation rules that have not been requsted by me. you must ask specific of what formating and validation i would want (ex: no duplicate serials, MAC must be a valid mac, etc.)