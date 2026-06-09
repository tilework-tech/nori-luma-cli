import { describe, it, expect, beforeEach } from "vitest";
import { createMockLumaService, runCommand, makeContact, makeContactTag } from "../helpers.js";

describe("contacts command", () => {
  let luma: ReturnType<typeof createMockLumaService>;

  beforeEach(() => {
    luma = createMockLumaService();
  });

  describe("contacts list", () => {
    it("lists contacts and returns paginated response", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", name: "Alice" }),
        makeContact({ id: "ct-2", email: "bob@example.com", name: "Bob" })
      );

      const result = await runCommand(luma, ["contacts", "list"]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].email).toBe("alice@example.com");
      expect(output.has_more).toBe(false);
    });

    it("passes --query option to filter contacts", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", name: "Alice" }),
        makeContact({ id: "ct-2", email: "bob@example.com", name: "Bob" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "list",
        "--query",
        "alice",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].email).toBe("alice@example.com");
    });

    it("passes --tags option to filter by tags", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", tags: [{ id: "tag-1", name: "vip" }] }),
        makeContact({ id: "ct-2", email: "bob@example.com", tags: [] })
      );

      const result = await runCommand(luma, [
        "contacts",
        "list",
        "--tags",
        "vip",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(1);
      expect(output.entries[0].email).toBe("alice@example.com");
    });

    it("handles pagination with --limit and --cursor", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "a@example.com" }),
        makeContact({ id: "ct-2", email: "b@example.com" }),
        makeContact({ id: "ct-3", email: "c@example.com" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "list",
        "--limit",
        "2",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.has_more).toBe(true);
      expect(output.next_cursor).toBeTruthy();
    });

    it("passes --membership-status filter", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "a@example.com" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "list",
        "--membership-status",
        "approved",
      ]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).entries).toHaveLength(1);
    });

    it("passes --sort-column and --sort-direction", async () => {
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "a@example.com" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "list",
        "--sort-column",
        "name",
        "--sort-direction",
        "asc",
      ]);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).entries).toHaveLength(1);
    });
  });

  describe("contacts import", () => {
    it("imports contacts with emails", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "import",
        "--emails",
        "alice@example.com,bob@example.com",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.imported).toBe(true);
      expect(luma.lastImportContactsParams).not.toBeNull();
      expect(luma.lastImportContactsParams!.contacts).toHaveLength(2);
      expect(luma.lastImportContactsParams!.contacts[0].email).toBe("alice@example.com");
    });

    it("imports contacts with names matched by position", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "import",
        "--emails",
        "alice@example.com,bob@example.com",
        "--names",
        "Alice,Bob",
      ]);
      expect(result.exitCode).toBe(0);

      expect(luma.lastImportContactsParams!.contacts[0].name).toBe("Alice");
      expect(luma.lastImportContactsParams!.contacts[1].name).toBe("Bob");
    });

    it("imports contacts with tags to apply", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "import",
        "--emails",
        "alice@example.com",
        "--tags",
        "vip,sponsor",
      ]);
      expect(result.exitCode).toBe(0);

      expect(luma.lastImportContactsParams!.tags).toEqual(["vip", "sponsor"]);
    });

    it("requires --emails flag", async () => {
      const result = await runCommand(luma, ["contacts", "import"]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts list-contact-tags", () => {
    it("lists contact tags", async () => {
      luma.contactTags.push(
        makeContactTag({ id: "tag-1", name: "VIP", color: "blue" }),
        makeContactTag({ id: "tag-2", name: "Sponsor", color: "green" })
      );

      const result = await runCommand(luma, ["contacts", "list-contact-tags"]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(2);
      expect(output.entries[0].name).toBe("VIP");
    });

    it("returns empty entries when no tags exist", async () => {
      const result = await runCommand(luma, ["contacts", "list-contact-tags"]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.entries).toHaveLength(0);
    });
  });

  describe("contacts create-contact-tag", () => {
    it("creates a contact tag with name", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "create-contact-tag",
        "--name",
        "VIP",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.id).toBeTruthy();
      expect(luma.contactTags).toHaveLength(1);
      expect(luma.contactTags[0].name).toBe("VIP");
    });

    it("creates a contact tag with color", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "create-contact-tag",
        "--name",
        "VIP",
        "--color",
        "cranberry",
      ]);
      expect(result.exitCode).toBe(0);

      expect(luma.contactTags[0].color).toBe("cranberry");
    });

    it("requires --name flag", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "create-contact-tag",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts apply-contact-tag", () => {
    it("applies a tag to contacts by emails", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP" }));
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", user_id: "usr-1" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "apply-contact-tag",
        "--tag",
        "VIP",
        "--emails",
        "alice@example.com",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.applied_count).toBe(1);
      expect(output.skipped_count).toBe(0);
    });

    it("applies a tag to contacts by user-ids", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP" }));
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", user_id: "usr-1" })
      );

      const result = await runCommand(luma, [
        "contacts",
        "apply-contact-tag",
        "--tag",
        "tag-1",
        "--user-ids",
        "usr-1",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.applied_count).toBe(1);
    });

    it("reports skipped contacts not found", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP" }));

      const result = await runCommand(luma, [
        "contacts",
        "apply-contact-tag",
        "--tag",
        "VIP",
        "--emails",
        "nobody@example.com",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.applied_count).toBe(0);
      expect(output.skipped_count).toBe(1);
    });

    it("requires --tag flag", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "apply-contact-tag",
        "--emails",
        "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts unapply-contact-tag", () => {
    it("removes a tag from contacts by emails", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP" }));
      luma.contacts.push(
        makeContact({ id: "ct-1", email: "alice@example.com", user_id: "usr-1", tags: [{ id: "tag-1", name: "VIP" }] })
      );

      const result = await runCommand(luma, [
        "contacts",
        "unapply-contact-tag",
        "--tag",
        "VIP",
        "--emails",
        "alice@example.com",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.removed_count).toBe(1);
      expect(output.skipped_count).toBe(0);
    });

    it("requires --tag flag", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "unapply-contact-tag",
        "--emails",
        "alice@example.com",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts update-contact-tag", () => {
    it("updates a contact tag name", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP", color: "blue" }));

      const result = await runCommand(luma, [
        "contacts",
        "update-contact-tag",
        "--tag-id",
        "tag-1",
        "--name",
        "Premium",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.updated).toBe(true);
      expect(luma.contactTags[0].name).toBe("Premium");
    });

    it("updates a contact tag color", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP", color: "blue" }));

      const result = await runCommand(luma, [
        "contacts",
        "update-contact-tag",
        "--tag-id",
        "tag-1",
        "--color",
        "red",
      ]);
      expect(result.exitCode).toBe(0);

      expect(luma.contactTags[0].color).toBe("red");
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "update-contact-tag",
        "--tag-id",
        "tag-nonexistent",
        "--name",
        "Foo",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --tag-id flag", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "update-contact-tag",
        "--name",
        "Foo",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts delete-contact-tag", () => {
    it("deletes a contact tag", async () => {
      luma.contactTags.push(makeContactTag({ id: "tag-1", name: "VIP" }));

      const result = await runCommand(luma, [
        "contacts",
        "delete-contact-tag",
        "--tag-id",
        "tag-1",
      ]);
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.deleted).toBe(true);
      expect(luma.contactTags).toHaveLength(0);
    });

    it("shows error when tag not found", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "delete-contact-tag",
        "--tag-id",
        "tag-nonexistent",
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("404");
    });

    it("requires --tag-id flag", async () => {
      const result = await runCommand(luma, [
        "contacts",
        "delete-contact-tag",
      ]);
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("contacts --help", () => {
    it("shows contacts subcommand help with available actions", async () => {
      const result = await runCommand(luma, ["contacts", "--help"]);
      expect(result.stdout).toContain("list");
      expect(result.stdout).toContain("import");
      expect(result.stdout).toContain("list-contact-tags");
      expect(result.stdout).toContain("create-contact-tag");
      expect(result.stdout).toContain("apply-contact-tag");
      expect(result.stdout).toContain("unapply-contact-tag");
      expect(result.stdout).toContain("update-contact-tag");
      expect(result.stdout).toContain("delete-contact-tag");
    });
  });
});
