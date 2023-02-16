import { z } from 'zod'

export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  validIps: z.array(z.string()).optional(),
  auth: z
    .array(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .optional(),
  serve: z
    .object({
      public: z.string(),
      cleanUrls: z.boolean(),
      rewrites: z
        .array(
          z.object({
            source: z.string(),
            destination: z.string(),
          })
        )
        .optional(),
      redirects: z
        .array(
          z.object({
            source: z.string(),
            destination: z.string(),
            type: z.number().optional(),
          })
        )
        .optional(),
      headers: z
        .array(
          z.object({
            source: z.string(),
            headers: z.array(
              z.object({
                key: z.string(),
                value: z.string(),
              })
            ),
          })
        )
        .optional(),
      directoryListing: z.union([z.boolean(), z.array(z.string())]).optional(),
      unlisted: z.array(z.string()).optional(),
      trailingSlash: z.boolean().optional(),
      renderSingle: z.boolean().optional(),
      symlinks: z.boolean().optional(),
      etag: z.boolean(),
    })
    .optional(),
}).strict()

export type Config = z.infer<typeof ConfigSchema>
