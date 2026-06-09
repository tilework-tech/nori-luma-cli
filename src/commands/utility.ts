import { Command } from "commander";
import type { LumaService } from "../services/luma.js";
import type { Output } from "../output.js";

export function createUtilityCommand(luma: LumaService, out: Output): Command {
  const utility = new Command("utility")
    .description("Utility commands for account info, entity lookups, and image uploads.")

  utility
    .command("get-self")
    .description("Get information about the authenticated user associated with the API key")
    .action(async () => {
      const result = await luma.getSelf();
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  utility
    .command("entity-lookup")
    .description("Look up an entity (calendar or event) by its lu.ma URL slug")
    .requiredOption("--slug <slug>", "The slug to look up (e.g. my-community from lu.ma/my-community)")
    .action(async (opts) => {
      const result = await luma.entityLookup(opts.slug);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  utility
    .command("image-upload")
    .description("Get a presigned URL for uploading an image to Luma's CDN")
    .option("--content-type <type>", "Image MIME type: image/jpeg or image/png")
    .action(async (opts) => {
      const params: { content_type?: string } = {};
      if (opts.contentType) {
        params.content_type = opts.contentType;
      }
      const result = await luma.createUploadUrl(params);
      out.write(JSON.stringify(result, null, 2) + "\n");
    });

  return utility;
}
