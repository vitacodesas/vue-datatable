# Componente DataTable (Vue 3 + TypeScript)

Este componente es una tabla dinámica reutilizable con opciones de búsqueda, ordenamiento, paginación y slots personalizados para renderizar contenido. Ideal para integrarse con una API externa mediante peticiones HTTP.

## 📦 Props

| Prop             | Tipo                                                                 | Requerido | Descripción                                                                 |
|------------------|----------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------|
| `headers`        | `THeaderTable[]`                                                    | ✅        | Encabezados de la tabla. Debe contener al menos una propiedad `label`.      |
| `url`            | `string`                                                            | ✅        | URL de la API a consultar.                                                  |
| `sortable`       | `string[]`                                                          | ❌        | Columnas que pueden ordenarse.                                              |
| `searchable`     | `string[]`                                                          | ❌        | Columnas por las cuales se puede buscar.                                    |
| `apiHeaders`     | `Record<string, string>`                                            | ❌        | Headers personalizados para las peticiones a la API.                       |
| `options`        | `object`                                                            | ❌        | Configuración general del componente (clases CSS, límites de paginación, etc). |
| `filter`         | `object`                                                            | ❌        | Filtros adicionales que se enviarán junto a la petición.                   |
| `requestFunction`| `(params, headers) => Promise<any>`                                 | ❌        | Función personalizada para realizar la petición.                           |

## ⚙️ Opciones (`options`)

```ts
{
    limit: number,
    maxVisiblePages: number,
    class: {
        data__table__wrapper: string,
        data__table: string,
        data__table__search: string,
        data__table__input: string,
        data__table__pagination: string,
        data__table__page_link: string,
        data__table__page_item: string,
        data__table__page_link_selected: string,
    }
}
```

## 🧩 Slots

| Nombre del slot         | Descripción                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| `empty`                 | Se muestra cuando no hay resultados en la tabla.                           |
| `:name="header.label"`  | Slot dinámico para personalizar el contenido de una celda específica. Recibe `{ row }`. |

## 🚀 Eventos emitidos

| Evento       | Parámetro       | Descripción                                                        |
|--------------|-----------------|--------------------------------------------------------------------|
| `newRows`    | `Array<any>`    | Se emite cada vez que se cargan nuevas filas desde el backend.     |
| `headerClick`| `THeaderTable`  | Se emite cuando se hace clic en un encabezado de columna ordenable.|

## 🔍 Funcionalidades

- **Búsqueda**: Activada si `searchable` no está vacío, muestra un input general de búsqueda.
- **Ordenamiento**: Controlado por `sortable`, muestra íconos de orden ascendente/descendente.
- **Paginación**: Automática y configurable.
- **Renderizado personalizado**: Mediante slots dinámicos por columna.

## 🔧 Uso básico

```vue
<DataTable
    :headers="tableHeaders"
    url="/api/users"
    :sortable="['name', 'email']"
    :searchable="['name']"
    :options="tableOptions"
    @newRows="onNewRows"
/>

<template #email="{ row }">
    <a :href="`mailto:${row.email}`">{{ row.email }}</a>
</template>

<template #empty>
    <p>No hay usuarios registrados.</p>
</template>
```

## 📄 Tipos relacionados

Se recomienda definir los siguientes tipos en el archivo `../types/table.ts`:

```ts
export type THeaderTable = {
    label: string;
    name?: string;
}

export type TSortBy = {
    column: string;
    order: 'ASC' | 'DESC';
}

export type TParamsRequest = {
    url: string;
    page: number;
    filter: object;
    limit: number;
    query?: string;
    searchBy?: object;
    sortBy?: TSortBy[];
}

export type Params = Record<string, string | number | string[]>;
```

## 🧪 Personalización avanzada

Puedes sobrescribir la función `requestFunction` para manejar tus propias peticiones usando Axios, agregar headers, o transformar la respuesta de forma personalizada.

```ts
const myCustomRequest = async (params, headers) => {
    const response = await axios.get('/api/usuarios', {
        params,
        headers
    });
    return response.data;
}
```