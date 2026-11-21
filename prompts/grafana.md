For the IOT-AUTH-MANAGER service, use the new SQL schema defined in `seed-v2.sql` to create a standard Grafana dashboard.
Goal:
Create a Grafana dashboard using a Milwaukee Tool red theme that provides visibility into registered IoT devices, device authentication activity, and device deployments across Global Operations.
The dashboard should provide visibility into:
- Total registered devices
- Devices by type
- Devices by model
- Authenticated devices
- Device JWT refresh history and status
- Active device records
- Device deployment locations and details
Dashboard structure:
Page 1: Device Overview
This is the main high-level dashboard for device metrics and overall fleet visibility.
Include:
- Total devices
- Authenticated devices
- Active device records
- Devices by type
- Devices by model
- High-level device deployment visibility
Page 2: Device Authentication
A detailed dashboard focused on device authentication activity.
Include:
- Device authentication metrics
- Device JWT refresh history
- Device JWT status
Page 3: Device Deployment Details
A detailed view of where IoT devices are deployed across Global Operations.
Include:
- Device deployment details
- Tables containing detailed device information
Requirements:
- Use the tables, columns, and relationships defined in `seed-v2.sql`.
- Use a Milwaukee Tool red visual theme.
- The final output must be a single valid Grafana dashboard JSON file.
- Name the file `grafana.json`.
- The JSON must be suitable for direct import into Grafana.
- Do not generate additional files.
Before generating the dashboard, inspect `seed-v2.sql` and base the Grafana queries on the actual schema rather than assuming table or column names.