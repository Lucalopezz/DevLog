CREATE TYPE "project_environment_category" AS ENUM ('LOCAL', 'DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION', 'OTHER');

CREATE TABLE "project_environments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalized_name" VARCHAR(100) NOT NULL,
    "category" "project_environment_category" NOT NULL,
    "operating_system" VARCHAR(100),
    "runtime" VARCHAR(100),
    "runtime_version" VARCHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "project_environments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_environments_project_id_normalized_name_key" ON "project_environments"("project_id", "normalized_name");
CREATE INDEX "idx_project_environments_project" ON "project_environments"("project_id");
CREATE INDEX "idx_project_environments_category" ON "project_environments"("category");
ALTER TABLE "project_environments" ADD CONSTRAINT "project_environments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
