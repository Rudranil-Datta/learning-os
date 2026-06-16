"use client";

import { useState, type FormEvent } from "react";

import { createNode, isNodesApiError } from "@/lib/api/nodes-client";

interface CreateNodeFormProps {
  readonly onCreated?: () => void;
}

export function CreateNodeForm({
  onCreated,
}: CreateNodeFormProps): React.JSX.Element {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createNode({
        title: title.trim(),
        description: description.trim() || null,
      });

      setTitle("");
      setDescription("");
      onCreated?.();
    } catch (submitError: unknown) {
      if (isNodesApiError(submitError)) {
        setError(submitError.message);
      } else {
        setError("Could not create node. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Create node
      </h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={255}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="Binary Search"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="Short definition"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || title.trim().length === 0}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isSubmitting ? "Creating..." : "Create node"}
      </button>
    </form>
  );
}
