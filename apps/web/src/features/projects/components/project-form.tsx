import type { SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";
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
            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isLoading}
              label="Nome"
              name="name"
              placeholder="Meu projeto"
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      disabled={isLoading}
                      placeholder="Uma breve descrição do projeto"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
