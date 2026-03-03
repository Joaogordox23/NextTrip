# 🎯 NEXTTRIP - ESPECIFICAÇÃO TÉCNICA COMPLETA

## VISÃO GERAL
Plataforma SaaS de gerenciamento de roteiros de viagem com arquitetura multi-tenant preparada, focada em escalabilidade, segurança e experiência fluida.

---

## 🏗️ ARQUITETURA & STACK

### Frontend Core
- **Next.js 14.2+** (App Router, React Server Components)
- **React 18** (Suspense, Error Boundaries, useOptimistic)
- **TypeScript 5+** (strict mode)
- **Tailwind CSS 3.4+** (container queries, arbitrary variants)

### UI & Forms
- **ShadCN/UI** (componentização base)
- **React Hook Form 7+** (modo controlled)
- **Zod 3+** (validação isomórfica)
- **Lucide React** (icons tree-shakeable)
- **Radix UI** (primitivos acessíveis)

### Estado & Data Fetching
- **TanStack Query v5** (server state, cache, optimistic updates)
- **Zustand 4+** (apenas para: auth state, UI state)
- **Nuqs** (query params como estado)

### Backend & Database
- **Next.js API Routes** (middleware pipeline)
- **Prisma 5+** (ORM com connection pooling)
- **PostgreSQL 15+** (JSON, índices GiST, full-text search)
- **Jose** (JWT moderno, melhor que jsonwebtoken)
- **Bcrypt** (hashing senhas)

### Infraestrutura
- **Vercel** (Edge Functions para rotas críticas)
- **Supabase** (PostgreSQL gerenciado + connection pooler)
- **Upstash Redis** (rate limiting, sessions)
- **Cloudinary** (mídia)
- **Google Maps API** (Places, Geocoding, Maps JavaScript)

---

## 🗂️ ESTRUTURA DE PASTAS (FEATURE-BASED)

```
/src
  /app
    /(auth)
      /login
      /register
    /(dashboard)
      layout.tsx
      /admin
        /trips
        /clients
        /suggestions
      /client
        /my-trips
        /[tripId]
    /api
      /auth
        /login
        /logout
        /refresh
        /me
      /v1
        /trips
        /itinerary
        /suggestions
        /geocode
        
  /components
    /ui (shadcn)
    /features
      /auth
      /trips
      /itinerary
      /suggestions
      /maps
    /layouts
    /providers
    
  /lib
    /db
      prisma.ts (singleton)
      migrations/
    /auth
      jwt.ts
      middleware.ts
      rbac.ts
    /validations
      auth.schema.ts
      trip.schema.ts
    /services (business logic)
      /trips
      /suggestions
      /itinerary
    /utils
      date.ts
      currency.ts
      error.ts
      
  /hooks
    useAuth.ts
    useTrip.ts
    useMap.ts
    
  /store
    auth.store.ts
    ui.store.ts
    
  /types
    models.ts
    api.ts
    enums.ts
    
  /config
    site.ts
    maps.ts
```

---

## 📊 MODELO DE DADOS (PRISMA)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  extensions = [postgis, pg_trgm]
}

enum Role {
  ADMIN
  CLIENT
}

enum TripStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

enum SuggestionType {
  ALTERATION
  NEW_POINT
  REMOVAL
}

enum SuggestionStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  passwordHash  String
  role          Role     @default(CLIENT)
  emailVerified DateTime?
  image         String?
  
  // Relations
  trips         Trip[]   @relation("ClientTrips")
  suggestions   Suggestion[]
  auditLogs     AuditLog[]
  sessions      Session[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([email])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([refreshToken])
  @@map("sessions")
}

model Trip {
  id           String      @id @default(cuid())
  title        String
  destination  String
  description  String?
  coverImage   String?
  
  startDate    DateTime
  endDate      DateTime
  timezone     String      @default("America/Sao_Paulo")
  
  totalCost    Decimal     @default(0) @db.Decimal(10,2)
  currency     String      @default("BRL")
  
  status       TripStatus  @default(DRAFT)
  
  clientId     String
  client       User        @relation("ClientTrips", fields: [clientId], references: [id])
  
  // Relations
  days         ItineraryDay[]
  suggestions  Suggestion[]
  auditLogs    AuditLog[]
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  @@index([clientId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("trips")
}

model ItineraryDay {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  title     String?
  notes     String?
  
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  items     ItineraryItem[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tripId, date])
  @@index([tripId])
  @@map("itinerary_days")
}

model ItineraryItem {
  id           String   @id @default(cuid())
  title        String
  description  String?
  
  locationName String
  address      String?
  latitude     Decimal  @db.Decimal(10,8)
  longitude    Decimal  @db.Decimal(11,8)
  placeId      String?  // Google Place ID
  
  cost         Decimal  @default(0) @db.Decimal(10,2)
  category     String?  // RESTAURANT, ATTRACTION, HOTEL, TRANSPORT
  
  startTime    DateTime @db.Time
  endTime      DateTime @db.Time
  
  orderIndex   Int
  
  dayId        String
  day          ItineraryDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  
  suggestions  Suggestion[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([dayId])
  @@index([latitude, longitude]) // Spatial queries
  @@map("itinerary_items")
}

model Suggestion {
  id            String           @id @default(cuid())
  content       String
  type          SuggestionType
  status        SuggestionStatus @default(PENDING)
  
  // For alterations
  itemId        String?
  item          ItineraryItem?   @relation(fields: [itemId], references: [id], onDelete: SetNull)
  
  // For new points (JSON)
  proposedData  Json?
  
  tripId        String
  trip          Trip             @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  userId        String
  user          User             @relation(fields: [userId], references: [id])
  
  // Admin response
  adminNotes    String?
  reviewedAt    DateTime?
  reviewedBy    String?
  
  auditLogs     AuditLog[]
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  @@index([tripId, status])
  @@index([userId])
  @@map("suggestions")
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String   // CREATE_TRIP, APPROVE_SUGGESTION, etc
  entityType  String   // TRIP, SUGGESTION, ITINERARY_ITEM
  entityId    String
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  tripId      String?
  trip        Trip?    @relation(fields: [tripId], references: [id], onDelete: SetNull)
  
  suggestionId String?
  suggestion   Suggestion? @relation(fields: [suggestionId], references: [id], onDelete: SetNull)
  
  metadata    Json?    // Before/after data
  ipAddress   String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([tripId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 🔐 AUTENTICAÇÃO & AUTORIZAÇÃO

### Estratégia JWT
```typescript
// Access Token: 15min (httpOnly cookie)
// Refresh Token: 7 dias (httpOnly cookie + DB)
// Rotation: Refresh token rotaciona a cada uso

// Middleware chain:
1. validateAccessToken
2. checkRole (RBAC)
3. rateLimiting
4. auditLog
```

### RBAC Matrix
```
| Feature              | ADMIN | CLIENT |
|----------------------|-------|--------|
| Create Trip          | ✅    | ❌     |
| View Own Trip        | ✅    | ✅     |
| Edit Trip            | ✅    | ❌     |
| Create Suggestion    | ❌    | ✅     |
| Review Suggestion    | ✅    | ❌     |
| View All Clients     | ✅    | ❌     |
```

---

## 🗺️ INTEGRAÇÃO GOOGLE MAPS

### Estratégia de Otimização
1. **Lazy Loading**: Carregar SDK apenas quando necessário
2. **Debounce**: Autocomplete com 300ms delay
3. **Cache**: Geocoding results (TanStack Query, 24h)
4. **Static Maps**: Preview de thumbnail
5. **Billing Alert**: Monitorar uso mensal

### Componentes
```typescript
<MapProvider apiKey={key} libraries={['places']}>
  <ItineraryMap 
    items={items}
    onMarkerClick={handleClick}
    optimizeRoute={true} // Calcula melhor ordem
  />
</MapProvider>
```

---

## 🔄 FLUXO DE SUGESTÃO (TRANSACTION)

```typescript
// Transaction garantindo atomicidade

async function approveSuggestion(suggestionId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar sugestão
    const suggestion = await tx.suggestion.findUnique({...})
    
    // 2. Aplicar alteração
    if (suggestion.type === 'ALTERATION') {
      await tx.itineraryItem.update({...})
    } else {
      await tx.itineraryItem.create({...})
    }
    
    // 3. Atualizar status
    await tx.suggestion.update({
      where: { id: suggestionId },
      data: { 
        status: 'APPROVED',
        reviewedAt: new Date()
      }
    })
    
    // 4. Recalcular custo total
    await recalculateTripCost(tx, suggestion.tripId)
    
    // 5. Audit log
    await tx.auditLog.create({...})
    
    // 6. Invalidar cache (TanStack Query)
    return suggestion
  })
}
```

---

## 🎨 DESIGN SYSTEM

### Tokens
```typescript
// tailwind.config.ts
{
  colors: {
    brand: {
      50: '#f0f9ff',
      500: '#0ea5e9',
      900: '#0c4a6e'
    }
  },
  borderRadius: {
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem'
  }
}
```

### Componentes Críticos
- `<OptimisticListItem />` (useOptimistic)
- `<InfiniteScroll />` (TanStack Query)
- `<DateRangePicker />` (timezone-aware)
- `<CurrencyInput />` (formatação por locale)
- `<MapDrawer />` (mobile-first)

---

## ⚡ PERFORMANCE

### Server Components Strategy
```
app/trips/[id]/page.tsx (RSC)
  ├─ <TripHeader /> (RSC)
  ├─ <ItineraryTimeline /> (RSC)
  │   └─ <ItineraryDayCard> (Client - interativo)
  └─ <SuggestionsPanel /> (Client - real-time)
```

### Cache Strategy
```typescript
// React Cache (RSC)
const getTrip = cache(async (id: string) => {...})

// TanStack Query (Client)
useQuery({
  queryKey: ['trip', id],
  queryFn: () => fetchTrip(id),
  staleTime: 5 * 60 * 1000, // 5min
  gcTime: 10 * 60 * 1000
})
```

### Database
```sql
-- Índices críticos
CREATE INDEX CONCURRENTLY idx_trips_client_status 
  ON trips(client_id, status);

CREATE INDEX CONCURRENTLY idx_itinerary_day_location 
  ON itinerary_items USING GIST(ll_to_earth(latitude, longitude));
```

---

## 🧪 TESTES

### Pirâmide
```
E2E (Playwright) - 10%
  └─ Fluxo crítico de sugestão
  
Integration (Vitest) - 30%
  └─ API routes
  └─ Database operations
  
Unit (Vitest) - 60%
  └─ Validações Zod
  └─ Utils (date, currency)
  └─ Services
```

---

## 🚀 MVP - ROADMAP

### Sprint 1 (Semana 1-2)
- [ ] Setup projeto
- [ ] Auth (login/register)
- [ ] CRUD trips (admin)
- [ ] CRUD itinerary days/items

### Sprint 2 (Semana 3-4)
- [ ] Google Maps integration
- [ ] Suggestion flow
- [ ] Dashboard admin
- [ ] Cliente view

### Sprint 3 (Semana 5-6)
- [ ] Optimistic UI
- [ ] Mobile responsiveness
- [ ] Testing
- [ ] Deploy

---

## 🛡️ SEGURANÇA CHECKLIST

- [x] Content Security Policy (CSP)
- [x] CSRF tokens
- [x] Rate limiting (Upstash)
- [x] SQL injection (Prisma protege)
- [x] XSS (React escapa por padrão)
- [x] Secrets no .env.local
- [x] HTTPS only
- [x] Helmet headers
- [x] Input sanitization
- [x] Role-based access

---

## 📈 ESCALABILIDADE FUTURA

### Multi-tenant Ready
```prisma
model Agency {
  id     String @id
  name   String
  users  User[]
  trips  Trip[]
}
```

### Features Preparadas
- Microservices extraction (API v2)
- Real-time via WebSockets
- Mobile app (React Native + Expo)
- AI recommendations
- Payment integration (Stripe)
- Multi-language (i18next)
- Multi-currency (dinero.js)

---

## 📚 DOCUMENTAÇÃO OBRIGATÓRIA

1. `README.md` - Setup, env vars, commands
2. `CONTRIBUTING.md` - Guidelines
3. `API.md` - Endpoints (OpenAPI 3.0)
4. `ADR/` - Architecture Decision Records
5. Storybook - UI components

---

## ✅ DEFINITION OF DONE

- [ ] Feature funciona em mobile e desktop
- [ ] Testes escritos e passando
- [ ] Validação Zod no frontend e backend
- [ ] Error boundaries implementadas
- [ ] Loading states
- [ ] Audit log registrado
- [ ] Code review aprovado
- [ ] Performance testada (Lighthouse > 90)
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Documentação atualizada

---

## 🎯 PRINCÍPIOS CORE

1. **Mobile-first** - Sempre
2. **Server Components** - Por padrão
3. **Validação isomórfica** - Zod everywhere
4. **Optimistic UI** - Feedback imediato
5. **Error recovery** - Retry automático
6. **Audit everything** - Rastreabilidade
7. **Cache agressivo** - Performance
8. **Type-safe** - End-to-end

---

## 🚨 RED FLAGS PARA EVITAR

❌ `any` no TypeScript  
❌ Lógica de negócio no componente  
❌ Fetch direto sem TanStack Query  
❌ Estado global desnecessário  
❌ Rerender do mapa em todo keystroke  
❌ Queries N+1 no Prisma  
❌ Secrets no código  
❌ Commit direto na main  
❌ Deploy sem testes  
❌ API sem rate limit  

---

## 🎓 INSTRUÇÕES PARA IA

Ao implementar este projeto, você deve:

### Estrutura de Código
- Sempre separar lógica de negócio de apresentação
- Criar services reutilizáveis em `/lib/services`
- Validar dados com Zod tanto no cliente quanto no servidor
- Usar Server Components por padrão, Client Components apenas quando necessário

### Padrões de Resposta
- Sempre retornar tipos consistentes das API routes
- Incluir mensagens de erro amigáveis
- Implementar loading states e error boundaries
- Usar optimistic updates onde apropriado

### Segurança
- Validar permissões em TODAS as API routes
- Nunca confiar em dados do cliente
- Sempre sanitizar inputs
- Registrar ações em audit log

### Performance
- Usar índices apropriados no banco
- Implementar pagination em listas
- Cachear dados que mudam pouco
- Otimizar queries (select apenas campos necessários)

### Testes
- Testar casos de sucesso e erro
- Testar permissões (RBAC)
- Testar validações
- Testar fluxos críticos end-to-end

---

**Este prompt cria uma base sólida para um SaaS moderno, escalável e pronto para produção.**