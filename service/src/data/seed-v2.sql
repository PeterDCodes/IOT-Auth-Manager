CREATE TABLE IF NOT EXISTS "device_type" (
  "cd_device_type" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "dt_record" TIMESTAMPTZ DEFAULT NOW(),
  "ds_type" VARCHAR(100)
);


CREATE TABLE IF NOT EXISTS "device_model" (
  "cd_device_model" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "cd_device_type" INTEGER,
  "ds_model" VARCHAR(100),
  "ds_vendor" VARCHAR(100),
  CONSTRAINT "FK_device_model_cd_device_type"
    FOREIGN KEY ("cd_device_type")
      REFERENCES "device_type"("cd_device_type")
);


CREATE TABLE IF NOT EXISTS "device" (
  "cd_device" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "device_uuid" UUID UNIQUE NOT NULL,
  "dt_record" TIMESTAMPTZ DEFAULT NOW(),
  "ds_device_name" VARCHAR(100) NOT NULL,
  "ds_asset_code" VARCHAR(100),
  "cd_device_type" INTEGER,
  "cd_device_model" INTEGER,
  "ds_serial_number" VARCHAR(100) NOT NULL,
  "ds_mac_address" VARCHAR(100) NOT NULL,
  "ds_ip_addr" VARCHAR(45),
  "dt_updated" TIMESTAMPTZ,
  CONSTRAINT "FK_device_cd_device_model"
    FOREIGN KEY ("cd_device_model")
      REFERENCES "device_model"("cd_device_model"),
  CONSTRAINT "FK_device_cd_device_type"
    FOREIGN KEY ("cd_device_type")
      REFERENCES "device_type"("cd_device_type")
);


CREATE TABLE IF NOT EXISTS "device_authentication" (
  "cd_device_auth" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "dt_record" TIMESTAMPTZ DEFAULT NOW(),
  "device_uuid" UUID NOT NULL,
  "ds_hashed_key" TEXT NOT NULL,
  "dt_authenticated" TIMESTAMPTZ NOT NULL,
  "dt_last_refresh" TIMESTAMPTZ,
  "dt_updated" TIMESTAMPTZ,
  "fl_active" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "FK_device_authentication_device_uuid"
    FOREIGN KEY ("device_uuid")
      REFERENCES "device"("device_uuid")
);


CREATE TABLE IF NOT EXISTS "device_deployment" (
  "cd_deployment" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "dt_record" TIMESTAMPTZ DEFAULT NOW(),
  "device_uuid" UUID,
  "cd_location" INTEGER,
  "cd_production_line" INTEGER,
  "ds_project" VARCHAR(100),
  "ds_owner" VARCHAR(100),
  CONSTRAINT "FK_device_deployment_device_uuid"
    FOREIGN KEY ("device_uuid")
      REFERENCES "device"("device_uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_device_name"
  ON "device" (LOWER("ds_device_name"));

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_device_serial_number"
  ON "device" ("ds_serial_number");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_device_mac_address"
  ON "device" (LOWER("ds_mac_address"));

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_device_authentication_uuid"
  ON "device_authentication" ("device_uuid");
