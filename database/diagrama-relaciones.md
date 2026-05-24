# Modelo de datos — Shop With Mel

## Diagrama ER

```mermaid
erDiagram
  users ||--o{ sales : registra
  clients ||--o{ sales : "opcional"
  sales ||--|{ sale_items : contiene
  products ||--o{ sale_items : referencia

  users {
    int id PK
    string email UK
    string password_hash
    string display_name
    bool is_active
  }

  products {
    int id PK
    string sku UK
    string name
    decimal price
    int stock
    bool is_active
  }

  clients {
    int id PK
    string name
    string phone
    string email
    bool is_active
  }

  sales {
    int id PK
    int client_id FK "nullable"
    int registered_by FK
    datetime sale_date
    decimal subtotal
    decimal discount
    decimal total
  }

  sale_items {
    int id PK
    int sale_id FK
    int product_id FK
    string product_name "snapshot"
    int quantity
    decimal unit_price
    decimal line_total
  }
```

## Reglas de negocio (en la app)

| Acción | Comportamiento |
|--------|----------------|
| Crear venta | Transacción: insertar `sales` + `sale_items`, restar `products.stock` |
| Cliente opcional | `sales.client_id` puede ser NULL (venta mostrador) |
| Borrar producto/cliente | Soft delete: `is_active = 0` |
| Historial | Filtrar `sales.sale_date` por rango de fechas |
| Detalle de venta | `sale_items.product_name` guarda el nombre al momento de la venta |
