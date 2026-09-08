import type { SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateProject } from "../hooks/use-create-project";
import { useProjectForm } from "../hooks/use-project-form";
import { ProjectFormFields } from "./project-form-fields";
import type { CreateProjectInput } from "../types/project";

export type ProjectFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Formulário responsável pela interface de criação de projetos.
 *
 * O hook useProjectForm configura React Hook Form e Zod; a mutation cuida da
 * chamada HTTP e dos efeitos globais, como toast e invalidação do cache.
 * Assim, este componente apenas conecta os campos ao fluxo de submissão.
 */
export function ProjectForm({ open, onOpenChange }: ProjectFormProps) {
  const form = useProjectForm();
  const createProjectMutation = useCreateProject();

  const { handleSubmit } = form;

  const onSubmit: SubmitHandler<CreateProjectInput> = async (data) => {
    try {
      // handleSubmit só chama esta função depois da validação do resolver.
      await createProjectMutation.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch {
      // O hook da mutation já exibe o erro via toast; o catch evita uma
      // Promise rejeitada não tratada no evento de submit.
    }
  };

  const isLoading =
    form.formState.isSubmitting || createProjectMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Novo projeto
          </DialogTitle>
          <DialogDescription className="leading-6">
            Cadastre um projeto para organizá-lo no DevLog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            {/*
              O wrapper de criação fornece o `form.control` configurado por
              useProjectForm. ProjectFormFields apenas renderiza e conecta nome
              e descrição; ele não sabe que a operação final será um POST.
            */}
            <ProjectFormFields
              control={form.control}
              disabled={isLoading}
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Criando..." : "Criar projeto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
