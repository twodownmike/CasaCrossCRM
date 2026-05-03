"use client";

import Link from "next/link";
import { createPerson, updatePerson, deletePerson } from "@/app/actions";
import type { Person } from "@/lib/types";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";

export function PersonForm({ person }: { person?: Person }) {
  const editing = !!person;
  return (
    <form action={editing ? updatePerson : createPerson} className="form-grid">
      {editing && <input type="hidden" name="id" value={person!.id} />}
      <div>
        <label className="form-label">Name</label>
        <input
          name="name"
          required
          className="input"
          defaultValue={person?.name || ""}
        />
      </div>
      <div>
        <label className="form-label">Role</label>
        <select
          name="role"
          required
          className="input"
          defaultValue={person?.role || "model"}
        >
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Email</label>
          <input
            name="email"
            type="email"
            className="input"
            defaultValue={person?.email || ""}
          />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input
            name="phone"
            className="input"
            defaultValue={person?.phone || ""}
          />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Instagram</label>
          <input
            name="instagram"
            className="input"
            defaultValue={person?.instagram || ""}
            placeholder="@handle"
          />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input
            name="location"
            className="input"
            defaultValue={person?.location || ""}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Specialty</label>
        <input
          name="specialty"
          className="input"
          defaultValue={person?.specialty || ""}
          placeholder="Garden-style florals · heirloom blooms"
        />
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
        >
          One line summary, shown right on the People list.
        </p>
      </div>
      <div>
        <label className="form-label">Bio</label>
        <textarea
          name="bio"
          className="input textarea"
          defaultValue={person?.bio || ""}
          placeholder="Longer notes — past clients, working style, anything good to remember."
        />
      </div>

      <button className="btn primary block" type="submit">
        {editing ? "Save changes" : "Add contact"}
      </button>

      {editing && (
        <form
          action={deletePerson}
          onSubmit={(e) => {
            if (
              !confirm(
                "Remove this contact? They will be removed from any events they were on.",
              )
            )
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={person!.id} />
          <button
            className="btn block"
            style={{ color: "var(--terracotta)" }}
            type="submit"
          >
            Remove contact
          </button>
        </form>
      )}

      <Link
        href={editing ? `/people/${person!.id}` : "/people"}
        className="cancel-link"
        style={{ textAlign: "center" }}
      >
        Cancel
      </Link>
    </form>
  );
}
