import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";

type CommonValues = FieldValues & {
  title: string;
  context: string;
  conclusion: string;
};

type Props<T extends CommonValues> = {
  control: Control<T>;
  disabled?: boolean;
};

export function TechnicalEntryFormFields<T extends CommonValues>({
  control,
  disabled = false,
}: Props<T>) {
  return (
    <>
      <FormInput
        autoComplete="off"
        control={control}
        disabled={disabled}
        label="Title"
        name={"title" as FieldPath<T>}
        placeholder="Unable to connect to the database"
      />

      <FormField
        control={control}
        name={"context" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Context</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="min-h-32 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                placeholder="Describe what happened, where it happened, and what you tried."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={"conclusion" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conclusion</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                placeholder="What did you learn or how did you solve it?"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
