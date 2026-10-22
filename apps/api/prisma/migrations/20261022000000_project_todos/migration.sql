CREATE TABLE "project_todos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "project_todos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_project_todos_order" ON "project_todos"("project_id", "completed_at", "created_at", "id");
ALTER TABLE "project_todos" ADD CONSTRAINT "project_todos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
