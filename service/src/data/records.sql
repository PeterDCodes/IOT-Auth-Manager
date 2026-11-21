-- IOT-AUTH-MANAGER demo seed data
-- Assumes seed-v2.sql schema already exists.
-- Safe to rerun: uses deterministic device UUIDs and ON CONFLICT handling.

BEGIN;

-- Device types
INSERT INTO device_type (cd_device_type, ds_type)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'MDI Tablet'),
  (2, 'Industrial PC'),
  (3, 'IoT Gateway'),
  (4, 'Edge Sensor')
ON CONFLICT DO NOTHING;

-- Device models
INSERT INTO device_model (cd_device_model, cd_device_type, ds_model, ds_vendor)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 1, 'Tab Active4 Pro', 'Samsung'),
  (2, 1, 'Tab Active5', 'Samsung'),
  (3, 2, 'UNO-2484G', 'Advantech'),
  (4, 3, 'IGT-124', 'Industrial Gateway'),
  (5, 4, 'ENV-100', 'IoT Sensor')
ON CONFLICT DO NOTHING;

-- Devices
INSERT INTO device (
  device_uuid, dt_record, ds_device_name, ds_asset_code,
  cd_device_type, cd_device_model, ds_serial_number,
  ds_mac_address, ds_ip_addr, dt_updated
)
VALUES
  ('10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '180 days', 'VN-MDI-TABLET-001', 'VN-EAM-1001', 1, 1, 'VN-TAB-0001', '02:00:00:00:00:01', '10.10.10.11', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '160 days', 'VN-MDI-TABLET-002', 'VN-EAM-1002', 1, 2, 'VN-TAB-0002', '02:00:00:00:00:02', '10.10.10.12', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '145 days', 'VN-EDGE-PC-001', 'VN-EAM-2001', 2, 3, 'VN-IPC-0001', '02:00:00:00:00:03', '10.10.20.21', NOW() - INTERVAL '4 hours'),
  ('10000000-0000-0000-0000-000000000004', NOW() - INTERVAL '120 days', 'PRC-IOT-GW-001', 'PRC-EAM-3001', 3, 4, 'PRC-GW-0001', '02:00:00:00:00:04', '10.20.10.31', NOW() - INTERVAL '8 hours'),
  ('10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '100 days', 'PRC-IOT-GW-002', 'PRC-EAM-3002', 3, 4, 'PRC-GW-0002', '02:00:00:00:00:05', '10.20.10.32', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000006', NOW() - INTERVAL '90 days', 'MEX-MDI-TABLET-001', 'MEX-EAM-1001', 1, 1, 'MEX-TAB-0001', '02:00:00:00:00:06', '10.30.10.11', NOW() - INTERVAL '30 minutes'),
  ('10000000-0000-0000-0000-000000000007', NOW() - INTERVAL '75 days', 'MEX-EDGE-PC-001', 'MEX-EAM-2001', 2, 3, 'MEX-IPC-0001', '02:00:00:00:00:07', '10.30.20.21', NOW() - INTERVAL '6 hours'),
  ('10000000-0000-0000-0000-000000000008', NOW() - INTERVAL '60 days', 'VN-SENSOR-001', 'VN-EAM-4001', 4, 5, 'VN-SEN-0001', '02:00:00:00:00:08', '10.10.40.41', NOW() - INTERVAL '10 minutes'),
  ('10000000-0000-0000-0000-000000000009', NOW() - INTERVAL '45 days', 'PRC-SENSOR-001', 'PRC-EAM-4001', 4, 5, 'PRC-SEN-0001', '02:00:00:00:00:09', '10.20.40.41', NOW() - INTERVAL '20 days'),
  ('10000000-0000-0000-0000-000000000010', NOW() - INTERVAL '30 days', 'MEX-IOT-GW-001', 'MEX-EAM-3001', 3, 4, 'MEX-GW-0001', '02:00:00:00:00:0A', '10.30.30.31', NOW() - INTERVAL '1 hour'),
  ('10000000-0000-0000-0000-000000000011', NOW() - INTERVAL '14 days', 'VN-MDI-TABLET-003', 'VN-EAM-1003', 1, 2, 'VN-TAB-0003', '02:00:00:00:00:0B', '10.10.10.13', NOW() - INTERVAL '14 days'),
  ('10000000-0000-0000-0000-000000000012', NOW() - INTERVAL '3 days', 'PRC-EDGE-PC-002', 'PRC-EAM-2002', 2, 3, 'PRC-IPC-0002', '02:00:00:00:00:0C', '10.20.20.22', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Authentication records. Hash values are synthetic dashboard seed values, not usable device secrets.
INSERT INTO device_authentication (
  device_uuid, ds_hashed_key, dt_authenticated,
  dt_last_refresh, dt_updated, fl_active
)
VALUES
  ('10000000-0000-0000-0000-000000000001', '$seed$device01', NOW() - INTERVAL '170 days', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes', TRUE),
  ('10000000-0000-0000-0000-000000000002', '$seed$device02', NOW() - INTERVAL '150 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', TRUE),
  ('10000000-0000-0000-0000-000000000003', '$seed$device03', NOW() - INTERVAL '140 days', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes', TRUE),
  ('10000000-0000-0000-0000-000000000004', '$seed$device04', NOW() - INTERVAL '115 days', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', TRUE),
  ('10000000-0000-0000-0000-000000000005', '$seed$device05', NOW() - INTERVAL '95 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', FALSE),
  ('10000000-0000-0000-0000-000000000006', '$seed$device06', NOW() - INTERVAL '85 days', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes', TRUE),
  ('10000000-0000-0000-0000-000000000007', '$seed$device07', NOW() - INTERVAL '70 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', TRUE),
  ('10000000-0000-0000-0000-000000000008', '$seed$device08', NOW() - INTERVAL '55 days', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', TRUE),
  ('10000000-0000-0000-0000-000000000009', '$seed$device09', NOW() - INTERVAL '40 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', FALSE),
  ('10000000-0000-0000-0000-000000000010', '$seed$device10', NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', TRUE),
  ('10000000-0000-0000-0000-000000000011', '$seed$device11', NOW() - INTERVAL '10 days', NULL, NOW() - INTERVAL '10 days', TRUE)
ON CONFLICT DO NOTHING;

-- Deployments. Location IDs and production-line IDs are representative test values.
INSERT INTO device_deployment (
  cd_deployment, dt_record, device_uuid, cd_location,
  cd_production_line, ds_project, ds_owner
)
OVERRIDING SYSTEM VALUE
VALUES
  (1, NOW() - INTERVAL '175 days', '10000000-0000-0000-0000-000000000001', 101, 1301, 'Digital MDI', 'VN Data'),
  (2, NOW() - INTERVAL '155 days', '10000000-0000-0000-0000-000000000002', 101, 1302, 'Digital MDI', 'VN Data'),
  (3, NOW() - INTERVAL '140 days', '10000000-0000-0000-0000-000000000003', 101, 1340, 'IIDM', 'VN Data'),
  (4, NOW() - INTERVAL '115 days', '10000000-0000-0000-0000-000000000004', 201, 9104, 'IoT Platform', 'PRC Data'),
  (5, NOW() - INTERVAL '95 days', '10000000-0000-0000-0000-000000000005', 201, 1555, 'IoT Platform', 'PRC Data'),
  (6, NOW() - INTERVAL '85 days', '10000000-0000-0000-0000-000000000006', 301, 1343, 'Digital MDI', 'MEX Data'),
  (7, NOW() - INTERVAL '70 days', '10000000-0000-0000-0000-000000000007', 301, 1345, 'IIDM', 'MEX Data'),
  (8, NOW() - INTERVAL '55 days', '10000000-0000-0000-0000-000000000008', 101, 1346, 'IoT Monitoring', 'VN Data'),
  (9, NOW() - INTERVAL '40 days', '10000000-0000-0000-0000-000000000009', 201, 1347, 'IoT Monitoring', 'PRC Data'),
  (10, NOW() - INTERVAL '25 days', '10000000-0000-0000-0000-000000000010', 301, 1348, 'IoT Platform', 'MEX Data'),
  (11, NOW() - INTERVAL '10 days', '10000000-0000-0000-0000-000000000011', 101, 1339, 'Digital MDI', 'VN Data'),
  (12, NOW() - INTERVAL '2 days', '10000000-0000-0000-0000-000000000012', 201, 1342, 'IIDM', 'PRC Data')
ON CONFLICT DO NOTHING;

-- Keep identity sequences ahead of seeded explicit IDs.
SELECT setval(pg_get_serial_sequence('device_type', 'cd_device_type'), COALESCE((SELECT MAX(cd_device_type) FROM device_type), 1), true);
SELECT setval(pg_get_serial_sequence('device_model', 'cd_device_model'), COALESCE((SELECT MAX(cd_device_model) FROM device_model), 1), true);
SELECT setval(pg_get_serial_sequence('device_deployment', 'cd_deployment'), COALESCE((SELECT MAX(cd_deployment) FROM device_deployment), 1), true);

COMMIT;
