import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'

type ProjectCommonFormValues = FieldValues & {
  name: string
  description?: string
}

type ProjectFormFieldsProps<TFieldValues extends ProjectCommonFormValues> = {
  // `control` é a ponte entre o formulário criado pelo wrapper e cada campo:
  // ele carrega valor, onChange, estado de erro e regras de acessibilidade.
  control: Control<TFieldValues>
  disabled?: boolean
}

/**
 * Campos presentes tanto na criação quanto na edição de um projeto.
 *
 * O componente recebe apenas `control`, então continua sendo o formulário
 * pai que decide o schema, os valores iniciais e a mutation. Essa separação
 * evita duplicar marcação e mantém cada fluxo responsável por sua operação.
 */
export function ProjectFormFields<TFieldValues extends ProjectCommonFormValues>({
  control,
  disabled = false,
}: ProjectFormFieldsProps<TFieldValues>) {
  return (
    <>
      <FormInput
        autoComplete="off"
        control={control}
        disabled={disabled}
        label="Nome"
        // A restrição ProjectCommonFormValues garante estes campos; a asserção
        // adapta essa garantia ao tipo recursivo de caminhos do React Hook Form.
        name={'name' as FieldPath<TFieldValues>}
        placeholder="Meu projeto"
      />

      {/*
        FormField adapta o textarea ao React Hook Form. O `field` recebido no
        render já contém as props necessárias para manter o valor sincronizado;
        por isso o componente compartilhado não precisa de um useState próprio.
      */}
      <FormField
        control={control}
        name={'description' as FieldPath<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={disabled}
                placeholder="Uma breve descrição do projeto"
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
