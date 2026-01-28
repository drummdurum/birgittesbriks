# Prisma Migration Guide

Your project has been successfully migrated from raw PostgreSQL to Prisma ORM! 🎉

## What Changed

### Database Setup
- ✅ Prisma schema created at `prisma/schema.prisma`
- ✅ All routes updated to use Prisma Client
- ✅ Session management still uses pg pool (for connect-pg-simple compatibility)

### Files Modified
1. **`routes/bookings.js`** - All database queries now use Prisma
2. **`routes/admin.js`** - All admin operations now use Prisma
3. **`server.js`** - Updated to import Prisma client
4. **`database/prisma.js`** - New file for Prisma client initialization
5. **`package.json`** - Updated scripts

### Models
- `Booking` - Main booking table
- `BlockedDate` - Blocked dates/periods
- `Session` - Express session storage

## Getting Started

### 1. Ensure Database Connection
Make sure your `.env` file has the correct `DATABASE_URL`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/birgittesbriks_dev"
```

### 2. Push Schema to Database
```bash
npm run db:push
```

Or create a migration:
```bash
npm run db:migrate
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Start Development
```bash
npm run dev
```

## Common Prisma Commands

```bash
# Push schema changes (for development)
npm run db:push

# Create a new migration (for production)
npm run db:migrate

# View database in GUI
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format schema
npx prisma format
```

## Advantages of Prisma

✅ **Type Safety** - Generated types for all models
✅ **Query Builder** - Chainable, intuitive API
✅ **Performance** - Better connection pooling
✅ **Auto-Migrations** - Version control for schema
✅ **IDE Support** - IntelliSense for queries
✅ **Less SQL** - Write less raw SQL code

## Example Query Patterns

### Create
```javascript
const booking = await prisma.booking.create({
  data: {
    navn: "John Doe",
    email: "john@example.com",
    telefon: "12345678",
    ønsket_dato: new Date('2025-02-01'),
    ønsket_tid: "14:00"
  }
});
```

### Read
```javascript
const bookings = await prisma.booking.findMany({
  where: { status: "confirmed" },
  orderBy: { created_at: 'desc' }
});

const booking = await prisma.booking.findUnique({
  where: { id: 1 }
});
```

### Update
```javascript
const updated = await prisma.booking.update({
  where: { id: 1 },
  data: { status: "completed" }
});
```

### Delete
```javascript
await prisma.booking.delete({
  where: { id: 1 }
});
```

### Advanced Queries
```javascript
// Count
const count = await prisma.booking.count({
  where: { status: 'pending' }
});

// Transactions
await prisma.$transaction([
  prisma.booking.update(...),
  prisma.booking.update(...)
]);
```

## Migration Checklist

- [x] Prisma installed and configured
- [x] Schema created from existing database
- [x] All routes migrated to Prisma
- [x] Session handling configured
- [x] Package.json updated with new scripts
- [ ] Database pushed to production
- [ ] All tests pass
- [ ] Deployment successful

## Need Help?

- **Prisma Docs**: https://www.prisma.io/docs/
- **Prisma GitHub**: https://github.com/prismaio/prisma
- **Prisma Community**: https://prisma.io/community

Happy coding! 🚀
