-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('ACTIVE', 'PAUSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "technical_entry_type" AS ENUM ('ISSUE', 'LEARNING');

-- CreateEnum
CREATE TYPE "solution_attempt_result" AS ENUM ('FAILED', 'PARTIAL', 'SUCCESSFUL');

-- CreateEnum
CREATE TYPE "project_resource_type" AS ENUM ('REPOSITORY', 'DOCUMENTATION', 'LOCAL_URL', 'EXTERNAL_URL', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'ACTIVE',
    "local_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "type" "technical_entry_type" NOT NULL,
    "context" TEXT NOT NULL,
    "conclusion" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "technical_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "technical_entry_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "result" "solution_attempt_result" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "solution_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalized_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_entry_tags" (
    "technical_entry_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_entry_tags_pkey" PRIMARY KEY ("technical_entry_id","tag_id")
);

-- CreateTable
CREATE TABLE "project_technologies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_commands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "command" TEXT NOT NULL,
    "description" TEXT,
    "execution_order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "url" TEXT NOT NULL,
    "type" "project_resource_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_projects_user" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "idx_projects_active" ON "projects"("user_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "projects_user_id_name_key" ON "projects"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_entries_user_created" ON "technical_entries"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_entries_active_created" ON "technical_entries"("user_id", "archived_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_entries_project" ON "technical_entries"("project_id");

-- CreateIndex
CREATE INDEX "idx_entries_type" ON "technical_entries"("user_id", "type");

-- CreateIndex
CREATE INDEX "idx_entries_resolved" ON "technical_entries"("user_id", "resolved_at");

-- CreateIndex
CREATE INDEX "idx_attempts_entry" ON "solution_attempts"("technical_entry_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_normalized_name_key" ON "tags"("user_id", "normalized_name");

-- CreateIndex
CREATE INDEX "idx_entry_tags_tag" ON "technical_entry_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_technologies_project" ON "project_technologies"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_technologies_project_id_name_key" ON "project_technologies"("project_id", "name");

-- CreateIndex
CREATE INDEX "idx_commands_project_order" ON "project_commands"("project_id", "execution_order");

-- CreateIndex
CREATE INDEX "idx_resources_project" ON "project_resources"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_resources_project_id_url_key" ON "project_resources"("project_id", "url");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_entries" ADD CONSTRAINT "technical_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_entries" ADD CONSTRAINT "technical_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_attempts" ADD CONSTRAINT "solution_attempts_technical_entry_id_fkey" FOREIGN KEY ("technical_entry_id") REFERENCES "technical_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_entry_tags" ADD CONSTRAINT "technical_entry_tags_technical_entry_id_fkey" FOREIGN KEY ("technical_entry_id") REFERENCES "technical_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_entry_tags" ADD CONSTRAINT "technical_entry_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_commands" ADD CONSTRAINT "project_commands_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
