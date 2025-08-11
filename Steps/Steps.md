# Confluence Space Migration Steps

## Phase 1: Discovery & Selection

🔹 **Step 1: Get All Spaces for Dropdown**
```
GET /wiki/rest/api/space?limit=100&expand=description.plain,permissions
```
- Populate space selector dropdown
- Show space key, name, and description

🔹 **Step 2: Get Space Details on Selection**
```
GET /wiki/rest/api/space/{SPACE_KEY}?expand=description.plain,permissions
```

## Phase 2: Count Analysis (for Progress Percentage)

🔹 **Step 3: Count All Pages in Space (Root + Folders)**
```
GET /wiki/rest/api/content?spaceKey={SPACE_KEY}&type=page&limit=1000&expand=ancestors
```
- Count total pages (both root-level and nested)
- Identify pages directly in space (ancestors = empty)
- Identify folder structure (pages with children)
- Identify nested pages (ancestors = populated)

🔹 **Step 4: Count All Attachments**
```
GET /wiki/rest/api/content?spaceKey={SPACE_KEY}&type=page&limit=1000
```
Then for each page:
```
GET /wiki/rest/api/content/{pageId}/child/attachment
```
- Count total attachments across all pages

🔹 **Step 5: Count All Comments**
```
GET /wiki/rest/api/content?spaceKey={SPACE_KEY}&type=page&limit=1000
```
Then for each page:
```
GET /wiki/rest/api/content/{pageId}/child/comment
```
- Count total comments across all pages

## Phase 3: Target Space Creation

🔹 **Step 6: Create Target Space**
```
POST /wiki/rest/api/space
```
Payload:
- key: target space key
- name: space name
- description: space description
- type: "global"

🔹 **Step 7: Set Space Permissions**
```
POST /wiki/rest/api/space/{SPACE_KEY}/permission
```

## Phase 4: Migration Execution (In Hierarchy Order)

🔹 **Step 8: Migrate Root-Level Pages**
```
POST /wiki/rest/api/content
```
- Migrate pages directly in space (ancestors = empty)
- These become top-level pages in target space
- Payload includes: type: "page", space.key, title, body.storage.value

🔹 **Step 9: Migrate Folder Structure (Parent Pages)**
```
POST /wiki/rest/api/content
```
- Migrate pages that act as folders/containers
- Create folder hierarchy in target space
- Payload includes: type: "page", space.key, title, body.storage.value

🔹 **Step 10: Migrate Child Pages**
```
POST /wiki/rest/api/content
```
- Migrate pages within folders
- Maintain parent-child relationships using ancestors
- Payload includes: ancestors: [{"id": parentPageId}]

🔹 **Step 11: Migrate Page Content & Labels**
For each migrated page:
```
GET /wiki/rest/api/content/{sourcePageId}/label
POST /wiki/rest/api/content/{targetPageId}/label
```

🔹 **Step 12: Migrate Attachments**
For each page with attachments:
```
GET /wiki/rest/api/content/{sourcePageId}/child/attachment
POST /wiki/rest/api/content/{targetPageId}/child/attachment
```
Headers: Content-Type: multipart/form-data

🔹 **Step 13: Migrate Comments**
For each page with comments:
```
GET /wiki/rest/api/content/{sourcePageId}/child/comment
POST /wiki/rest/api/content
```
Payload:
- type: "comment"
- container.id: target page ID
- body.storage.value: comment content

🔹 **Step 14: Set Page Restrictions**
```
GET /wiki/rest/api/content/{sourcePageId}/restriction/byOperation
PUT /wiki/rest/api/content/{targetPageId}/restriction
```

## Phase 5: Validation & Cleanup

🔹 **Step 15: Verify Migration Completeness**
```
GET /wiki/rest/api/space/{TARGET_SPACE_KEY}/content/page
```
- Validate all items were migrated
- Compare counts with source space

## Progress Calculation Formula:
```
Total Items = Folders + Pages + Attachments + Comments
Progress % = (Migrated Items / Total Items) * 100
```

## Migration Order Priority:
1. **Space Creation** (1 item)
2. **Root-Level Pages** (Pages directly in space)
3. **Folder Structure** (Parent pages)
4. **Child Pages** (All sub-pages)
5. **Attachments** (Per page)
6. **Comments** (Per page)
7. **Permissions & Restrictions** (Per page)