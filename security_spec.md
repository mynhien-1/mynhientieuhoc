# Security Specification & Test Matrix

## 1. Data Invariants
1. **User Identity & Role Immutability**: A user cannot escalate their own `role` ('admin', 'vice_principal', 'lead', 'teacher') or change their `status` ('pending' -> 'active') upon self-registration. Only an admin can update roles and approval statuses.
2. **Bootstrapped Admin**: The initial administrator email `mynhienbobeo@gmail.com` is granted administrative access.
3. **Department Isolation**: A department lead (Tổ trưởng) can only inspect, comment, or approve documents belonging to their assigned department (`departmentId`). They are strictly denied access to documents from other departments.
4. **Ownership Invariant**: Teachers can only create documents where `ownerUid == request.auth.uid`. A teacher cannot modify or delete documents belonging to another teacher.
5. **Workflow State Locking**: Once a document is in `approved` state, teachers cannot modify the content without an admin or vice principal reopening it. Revisions can only be submitted when in `draft`, `need_revision`, or `rejected` state.
6. **Immutable Submitter**: On document update, `ownerUid` must match `resource.data.ownerUid`.
7. **Comment Attribution**: A comment or review action can only be created with `authorUid == request.auth.uid`.
8. **Version History Preservation**: Versions in `documents/{docId}/versions` can only be appended; existing versions cannot be edited or overwritten.

---

## 2. The "Dirty Dozen" Payloads (Attacks Designed to Break Integrity)

1. **Payload 1: Privilege Escalation on Register**
   - User signs up and attempts to set `"role": "admin"` and `"status": "active"`.
   - Expected: PERMISSION_DENIED.
2. **Payload 2: Role Hijack on Self-Update**
   - Non-admin user tries to update their own `users/{uid}` with `"role": "vice_principal"`.
   - Expected: PERMISSION_DENIED.
3. **Payload 3: Cross-Department Snooping by Department Lead**
   - Lead of `khoi_1` attempts to read/list documents with `departmentId: 'khoi_5'`.
   - Expected: PERMISSION_DENIED.
4. **Payload 4: Document Identity Spoofing**
   - User 'teacher_A' creates a document specifying `"ownerUid": "teacher_B"`.
   - Expected: PERMISSION_DENIED.
5. **Payload 5: Self-Approval by Teacher**
   - Teacher attempts to update their own document's status from `"submitted"` directly to `"approved"`.
   - Expected: PERMISSION_DENIED.
6. **Payload 6: Tampering with Approved Document**
   - Teacher attempts to replace `fileUrl` or `title` on an already `"approved"` document.
   - Expected: PERMISSION_DENIED.
7. **Payload 7: Unapproved User Data Access**
   - A newly registered user with `"status": "pending"` attempts to read `documents`.
   - Expected: PERMISSION_DENIED.
8. **Payload 8: Forged Review Comment**
   - Teacher attempts to create a comment in `documents/{docId}/comments` with `"authorUid": "vice_principal_uid"` and `"actionType": "approve"`.
   - Expected: PERMISSION_DENIED.
9. **Payload 9: Deletion of Audit History**
   - Teacher or lead attempts to delete `documents/{docId}/comments/{commentId}` or `documents/{docId}/versions/{vId}`.
   - Expected: PERMISSION_DENIED.
10. **Payload 10: Department Lead Cross-Department Approval**
    - Lead of `khoi_2` attempts to approve or request revision for a document in `khoi_3`.
    - Expected: PERMISSION_DENIED.
11. **Payload 11: Malicious Oversized Payload Injection**
    - Attacker sends an excessively long string (e.g. 50,000 characters) in `title` or `notes` to exhaust storage.
    - Expected: PERMISSION_DENIED (size bounds enforced).
12. **Payload 12: Unauthorized System Config Tampering**
    - Non-admin user attempts to write to `/system_settings/general` or `/categories/{catId}`.
    - Expected: PERMISSION_DENIED.
