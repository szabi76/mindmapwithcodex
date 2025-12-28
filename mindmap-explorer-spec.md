# MindMap Explorer - MVP Specification

## 1. Product Overview

### 1.1 Vision
MindMap Explorer is an AI-powered knowledge exploration tool that transforms any concept into a dynamic, navigable graph of related entities. Users can infinitely expand their exploration by drilling into any node, with the LLM generating contextually relevant ontologies on demand.

### 1.2 Core Value Proposition
- **Infinite exploration**: Any concept can be expanded indefinitely
- **Contextual intelligence**: LLM understands the exploration path and generates relevant connections
- **Living visualization**: Animated graph patterns create an engaging "thinking" experience
- **Persistent discovery**: Save and resume explorations across sessions

### 1.3 Target Users
MVP: 2 accounts (owner + friends) - limited access deployment

---

## 2. User Experience

### 2.1 Entry Flow
1. User logs in (simple username selection from 2 predefined accounts)
2. Landing page shows:
   - Search input for new exploration
   - Toggle: "Browse saved explorations"
   - Mode toggle: Contextual / Generic (default: Contextual)
   - Animation pattern selector (default: Gentle Drift)

### 2.2 New Exploration Flow
1. User enters a concept (e.g., "French Revolution")
2. System shows loading state with pulsing animation
3. LLM generates initial ontology
4. Graph renders with animated nodes appearing
5. Center node = input concept, surrounded by related entities
6. Auto-save triggers

### 2.3 Node Interaction
When user clicks a node, a small radial menu appears with 2 options:

**Explain** (info icon)
- Opens modal with semi-transparent overlay
- Shows LLM-generated summary of the node
- In Contextual mode: summary reflects the exploration path
- In Generic mode: standalone summary
- Modal has close button (X) and click-outside-to-close

**Expand** (plus icon)
- Node becomes new center
- LLM generates new ontology for this node
- New nodes animate in
- Graph re-centers on expanded node
- Previous nodes remain visible but de-emphasized
- Auto-save triggers
- Exploration history updated

### 2.4 Navigation
**Exploration History Panel** (collapsible sidebar or dropdown)
- Shows list of expansion steps: `French Revolution → Robespierre → The Terror → ...`
- Click any step to jump back to that state
- Forward navigation available after going back
- Current position highlighted

**Graph Controls**
- Zoom in/out (buttons + scroll wheel)
- Pan (drag canvas)
- Fit to screen button
- Animation pattern selector dropdown

### 2.5 Mode Toggle: Contextual vs Generic
**Contextual Mode** (default)
- Expansions consider the full exploration path
- Explains are tailored to context
- Example: Expanding "Robespierre" from "French Revolution" generates Revolution-focused connections

**Generic Mode**
- Expansions treat node in isolation
- Explains are standalone summaries
- Example: Expanding "Robespierre" generates all aspects of his life/work

### 2.6 Saved Explorations
**Browse Panel**
- List of saved explorations with:
  - Starting concept (title)
  - Preview of key nodes (first 5)
  - Last modified date
  - Node count
- Search bar: filters by concept/entity titles
- Click to load exploration
- Delete option (with confirmation)

---

## 3. Data Model

### 3.1 Exploration Document (DynamoDB)
```json
{
  "explorationId": "uuid-v4",
  "userId": "owner | friends",
  "startingConcept": "French Revolution",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T11:45:00Z",
  "mode": "contextual | generic",
  "currentStateIndex": 3,
  "states": [
    {
      "stateIndex": 0,
      "timestamp": "2025-01-15T10:30:00Z",
      "expandedNodeId": null,
      "graph": { /* GraphState */ }
    },
    {
      "stateIndex": 1,
      "timestamp": "2025-01-15T10:32:00Z",
      "expandedNodeId": "node-123",
      "graph": { /* GraphState */ }
    }
  ],
  "searchableTerms": ["french revolution", "robespierre", "the terror", "jacobins"]
}
```

### 3.2 Graph State
```json
{
  "nodes": [
    {
      "id": "node-uuid",
      "label": "Robespierre",
      "category": "Person",
      "categorySource": "fixed | llm",
      "isExpanded": true,
      "isCenter": false,
      "position": { "x": 150, "y": 200 },
      "metadata": {
        "brief": "Revolutionary leader and architect of the Terror",
        "generatedAt": "2025-01-15T10:32:00Z"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-uuid",
      "source": "node-123",
      "target": "node-456",
      "label": "led",
      "weight": 0.8
    }
  ],
  "centerNodeId": "node-456",
  "explorationPath": ["node-001", "node-123", "node-456"]
}
```

### 3.3 Node Categories

**Fixed Categories (minimum 50% of nodes per expansion)**

| Domain | Categories |
|--------|------------|
| Universal | Person, Event, Concept, Place, Time Period, Organization, Work |
| History | Movement, Conflict, Treaty, Dynasty |
| Arts | Artwork, Genre, Style, Medium |
| Science | Theory, Discovery, Phenomenon, Field |
| Philosophy | School of Thought, Argument |
| Politics | Institution, Policy, Ideology |

**Total: 20 fixed categories**

LLM may add custom categories when needed (e.g., "Culinary Technique" for food-related explorations).

Constraint: Maximum 20 different category types per expansion.

---

## 4. API Specification

### 4.1 Authentication
Simple token-based auth with 2 hardcoded users:
- Token passed in `Authorization: Bearer <token>` header
- Tokens stored in Lambda environment variables

### 4.2 Endpoints

#### POST /explore/start
Start a new exploration with initial concept.

**Request:**
```json
{
  "concept": "French Revolution",
  "mode": "contextual"
}
```

**Response:**
```json
{
  "explorationId": "uuid",
  "graph": { /* GraphState */ },
  "stateIndex": 0
}
```

#### POST /explore/{explorationId}/expand
Expand a node to generate new ontology.

**Request:**
```json
{
  "nodeId": "node-123",
  "mode": "contextual"
}
```

**Response:**
```json
{
  "graph": { /* Updated GraphState */ },
  "stateIndex": 2,
  "newNodes": [ /* Array of new node objects */ ],
  "newEdges": [ /* Array of new edge objects */ ]
}
```

#### POST /explore/{explorationId}/explain
Get explanation for a node.

**Request:**
```json
{
  "nodeId": "node-123",
  "mode": "contextual"
}
```

**Response:**
```json
{
  "explanation": "Maximilien Robespierre was a French lawyer and statesman who became one of the most influential figures of the French Revolution...",
  "contextPath": ["French Revolution", "Political Leaders", "Robespierre"]
}
```

#### GET /explore/{explorationId}/state/{stateIndex}
Get a specific state for navigation.

**Response:**
```json
{
  "graph": { /* GraphState at that index */ },
  "stateIndex": 1
}
```

#### GET /explorations
List user's saved explorations.

**Query params:**
- `search`: optional search term (filters by concept/entity titles)

**Response:**
```json
{
  "explorations": [
    {
      "explorationId": "uuid",
      "startingConcept": "French Revolution",
      "nodeCount": 45,
      "updatedAt": "2025-01-15T11:45:00Z",
      "previewNodes": ["Robespierre", "The Terror", "Jacobins", "Louis XVI", "Bastille"]
    }
  ]
}
```

#### DELETE /explorations/{explorationId}
Delete an exploration.

**Response:**
```json
{
  "deleted": true
}
```

---

## 5. LLM Prompt Engineering

### 5.1 Ontology Generation Prompt (Expand)

```
You are generating a knowledge ontology for exploration. Given a concept and optional context, produce related entities with categorized relationships.

CONTEXT:
- Current node: {{nodeName}}
- Exploration mode: {{mode}}
- Exploration path (if contextual): {{explorationPath}}

CONSTRAINTS:
- Generate 8-12 related entities
- At least 50% must use these fixed categories: Person, Event, Concept, Place, Time Period, Organization, Work, Movement, Conflict, Treaty, Dynasty, Artwork, Genre, Style, Medium, Theory, Discovery, Phenomenon, Field, School of Thought, Argument, Institution, Policy, Ideology
- Maximum 20 different category types total
- Each entity needs a relationship label to the source node
- Relationship labels should be verbs or verb phrases (e.g., "led to", "influenced", "opposed", "created", "participated in")

{{#if contextual}}
CONTEXTUAL MODE: Generate entities specifically relevant to the exploration path. For example, if exploring "Robespierre" from "French Revolution → Political Leaders", focus on his revolutionary activities, not his childhood or unrelated biography.
{{else}}
GENERIC MODE: Generate a balanced overview of the entity across all its significant aspects.
{{/if}}

OUTPUT FORMAT (JSON):
{
  "nodes": [
    {
      "label": "Entity Name",
      "category": "Category",
      "categorySource": "fixed" | "llm",
      "brief": "One sentence description",
      "relationshipToSource": "verb phrase"
    }
  ]
}
```

### 5.2 Explanation Prompt

```
You are providing an explanation of a concept within a knowledge exploration.

CONCEPT: {{nodeName}}
CATEGORY: {{category}}
MODE: {{mode}}

{{#if contextual}}
EXPLORATION PATH: {{explorationPath}}
Provide an explanation that emphasizes this concept's relevance to the exploration journey. The user arrived here through: {{pathDescription}}.
{{else}}
Provide a comprehensive standalone explanation of this concept.
{{/if}}

CONSTRAINTS:
- 150-300 words
- Start with the most important information
- Use clear, accessible language
- Include 2-3 specific facts or examples
- End with why this concept matters or connects to broader themes

OUTPUT: Plain text explanation (no JSON)
```

---

## 6. Frontend Specification

### 6.1 Tech Stack
- React 18+ with TypeScript
- React Flow (graph visualization)
- Zustand (state management)
- Tailwind CSS (styling)
- Framer Motion (animations)

### 6.2 Component Architecture

```
App
├── AuthGate
│   └── LoginScreen (simple user selection)
├── MainLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── ModeToggle (Contextual/Generic)
│   │   ├── AnimationPatternSelector
│   │   └── UserMenu
│   ├── Sidebar (collapsible)
│   │   ├── NewExplorationInput
│   │   ├── ExplorationHistory (back/forward navigation)
│   │   └── SavedExplorationsBrowser
│   └── GraphCanvas
│       ├── ReactFlowWrapper
│       │   ├── CustomNode
│       │   └── CustomEdge
│       ├── NodeActionMenu (radial: Explain/Expand)
│       └── GraphControls (zoom, fit, pan)
├── ExplainModal
│   └── ExplanationContent
└── LoadingOverlay
```

### 6.3 Graph Animation Patterns

**1. Static**
- No movement
- Nodes stay in calculated positions

**2. Gentle Drift** (default)
- Subtle random movement
- Nodes slowly float within small radius
- Organic, calm feeling

**3. Circular Orbit**
- Nodes orbit around center node
- Speed based on distance from center
- Inner nodes faster, outer nodes slower

**4. Constellation Pulse**
- Periodic "breathing" effect
- Nodes move slightly outward then inward
- Edges pulse with subtle glow
- Synchronized rhythm

### 6.4 Visual Design

**Color Scheme**
- Background: Dark (#0f1419)
- Nodes: Category-based colors with luminosity variations
- Edges: Subtle gray (#4a5568) with hover highlight
- Center node: Highlighted border/glow
- Expanded nodes: Slightly larger, distinct border

**Category Color Map**
```javascript
const categoryColors = {
  Person: '#6366f1',      // Indigo
  Event: '#f59e0b',       // Amber
  Concept: '#8b5cf6',     // Purple
  Place: '#10b981',       // Emerald
  TimePeriod: '#64748b',  // Slate
  Organization: '#3b82f6', // Blue
  Work: '#ec4899',        // Pink
  Movement: '#f97316',    // Orange
  Conflict: '#ef4444',    // Red
  Treaty: '#14b8a6',      // Teal
  // ... etc
  default: '#71717a'      // Zinc (for LLM-generated categories)
};
```

**Node Styling**
- Rounded rectangle with category color
- Label: White text, category below in smaller text
- Expanded indicator: Small dot or checkmark
- Center node: Glowing border animation

**Edge Styling**
- Curved bezier lines
- Relationship label on hover (or always if space allows)
- Directional arrow at target
- Reduced opacity for older connections

### 6.5 Responsive Behavior
- Desktop-first (MVP)
- Minimum width: 1024px
- Graph fills available space
- Sidebar collapsible on smaller screens

---

## 7. Backend Specification

### 7.1 Lambda Functions

**explore-start**
- Trigger: API Gateway POST /explore/start
- Actions:
  1. Validate auth token
  2. Call Claude API with ontology prompt
  3. Parse response, generate node/edge IDs
  4. Create DynamoDB record
  5. Return initial graph state

**explore-expand**
- Trigger: API Gateway POST /explore/{id}/expand
- Actions:
  1. Validate auth + ownership
  2. Fetch current exploration from DynamoDB
  3. Build context from exploration path
  4. Call Claude API with expansion prompt
  5. Merge new nodes/edges into graph
  6. Save new state to DynamoDB
  7. Return updated graph

**explore-explain**
- Trigger: API Gateway POST /explore/{id}/explain
- Actions:
  1. Validate auth + ownership
  2. Fetch exploration for context
  3. Call Claude API with explanation prompt
  4. Return explanation text

**explorations-list**
- Trigger: API Gateway GET /explorations
- Actions:
  1. Validate auth
  2. Query DynamoDB for user's explorations
  3. Optional: filter by search term (scan searchableTerms)
  4. Return list with previews

**exploration-state**
- Trigger: API Gateway GET /explore/{id}/state/{index}
- Actions:
  1. Validate auth + ownership
  2. Fetch specific state from exploration
  3. Return graph state

**exploration-delete**
- Trigger: API Gateway DELETE /explorations/{id}
- Actions:
  1. Validate auth + ownership
  2. Delete from DynamoDB
  3. Return confirmation

### 7.2 DynamoDB Schema

**Table: mindmap-explorations**

| Attribute | Type | Key |
|-----------|------|-----|
| explorationId | String | Partition Key |
| userId | String | GSI Partition Key |
| startingConcept | String | |
| createdAt | String (ISO) | |
| updatedAt | String (ISO) | GSI Sort Key |
| mode | String | |
| currentStateIndex | Number | |
| states | List | |
| searchableTerms | List | |

**GSI: userId-updatedAt-index**
- For listing user's explorations sorted by recent

### 7.3 Environment Variables

```
CLAUDE_API_KEY=sk-ant-...
AUTH_TOKEN_OWNER=<generated-token>
AUTH_TOKEN_FRIENDS=<generated-token>
DYNAMODB_TABLE=mindmap-explorations
```

---

## 8. Error Handling

### 8.1 API Errors

| Code | Scenario | User Message |
|------|----------|--------------|
| 400 | Invalid input | "Please enter a valid concept" |
| 401 | Invalid token | "Session expired. Please log in again" |
| 403 | Not owner | "You don't have access to this exploration" |
| 404 | Not found | "Exploration not found" |
| 429 | Rate limit | "Too many requests. Please wait a moment" |
| 500 | LLM failure | "AI service temporarily unavailable. Try again" |
| 503 | DynamoDB issue | "Database unavailable. Try again shortly" |

### 8.2 Frontend Error States
- Network failure: Retry button with exponential backoff
- LLM timeout: "Taking longer than expected..." with cancel option
- Invalid graph state: Reset to last valid state

---

## 9. Performance Considerations

### 9.1 Targets
- Initial load: < 2s
- Expand operation: < 5s (including LLM call)
- Explain operation: < 3s
- Graph render (100 nodes): < 500ms
- Animation: 60fps

### 9.2 Optimizations
- Debounce search input (300ms)
- Lazy load exploration history
- Virtualize large graphs (React Flow handles this)
- Cache explanations client-side
- Compress graph state in DynamoDB

---

## 10. Security

### 10.1 Authentication
- Bearer tokens (hardcoded for MVP)
- Tokens never exposed in frontend bundle
- All API calls over HTTPS

### 10.2 Data Protection
- Claude API key stored in Lambda env vars
- DynamoDB encryption at rest (default)
- No PII stored (just usernames: "owner", "friends")

### 10.3 Input Validation
- Concept input: max 200 characters, sanitized
- Node IDs validated as UUIDs
- State indices validated as positive integers

---

## 11. Future Enhancements (Post-MVP)

- User accounts with proper auth (Cognito)
- Sharing explorations via link
- Collaborative real-time exploration
- Export to various formats (PNG, JSON, Markdown)
- Custom node categories
- Multiple starting points
- Graph merging
- Mobile optimization
- Embedding in other apps
- AI-suggested next explorations
- Exploration templates

---

## 12. Acceptance Criteria

### 12.1 Core Flow
- [ ] Can start new exploration with any concept
- [ ] Initial graph renders with 8-12 nodes
- [ ] Can click node and see Explain/Expand options
- [ ] Explain shows contextual summary in modal
- [ ] Expand adds new nodes with animation
- [ ] Graph re-centers on expanded node

### 12.2 Navigation
- [ ] Can switch between Contextual/Generic modes
- [ ] Can navigate back/forward through expansion history
- [ ] Can change animation pattern
- [ ] Can zoom and pan graph

### 12.3 Persistence
- [ ] Explorations auto-save after each expansion
- [ ] Can browse saved explorations
- [ ] Can search saved explorations by title/entity
- [ ] Can delete explorations
- [ ] Can resume exploration where left off

### 12.4 Visual
- [ ] Nodes colored by category
- [ ] Edges show relationship labels
- [ ] Animation patterns work smoothly
- [ ] Modal has semi-transparent overlay
- [ ] Loading states are clear

---

## Appendix A: Sample API Responses

### A.1 Start Exploration Response
```json
{
  "explorationId": "550e8400-e29b-41d4-a716-446655440000",
  "graph": {
    "nodes": [
      {
        "id": "node-001",
        "label": "French Revolution",
        "category": "Event",
        "categorySource": "fixed",
        "isExpanded": false,
        "isCenter": true,
        "position": { "x": 0, "y": 0 },
        "metadata": {
          "brief": "Political and social upheaval in France from 1789 to 1799",
          "generatedAt": "2025-01-15T10:30:00Z"
        }
      },
      {
        "id": "node-002",
        "label": "Storming of the Bastille",
        "category": "Event",
        "categorySource": "fixed",
        "isExpanded": false,
        "isCenter": false,
        "position": { "x": 200, "y": -100 },
        "metadata": {
          "brief": "July 14, 1789 attack on the Bastille fortress-prison",
          "generatedAt": "2025-01-15T10:30:00Z"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-001",
        "source": "node-001",
        "target": "node-002",
        "label": "began with",
        "weight": 0.9
      }
    ],
    "centerNodeId": "node-001",
    "explorationPath": ["node-001"]
  },
  "stateIndex": 0
}
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Exploration | A complete graph representing a user's journey from a starting concept |
| Ontology | The set of entities and relationships generated by the LLM for a concept |
| Expansion | The action of generating new nodes from an existing node |
| State | A snapshot of the graph at a point in the exploration |
| Contextual Mode | Expansion considers the full exploration path |
| Generic Mode | Expansion treats each node in isolation |

---

*Document Version: 1.0*
*Last Updated: 2025-01-15*
