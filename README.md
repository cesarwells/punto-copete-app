# Punto Copete — Club de puntos

Sistema de fidelización por puntos: inscripción de clientes, pantalla de caja con lector QR,
cuenta web del cliente y panel de administración.

Hecho con Next.js, Tailwind CSS y Supabase. Se publica en Vercel.

## Páginas

| Dirección | Para quién | Qué hace |
|---|---|---|
| `/inscribirse` | Clientes | Formulario de inscripción (RUT, nombre, teléfono, correo) |
| `/ingresar` | Clientes | Entrar a su cuenta con RUT + código de 6 dígitos por correo |
| `/mi-cuenta/{token}` | Clientes | Saldo, QR, historial, premios y promociones |
| `/caja` | Personal | Escanear QR o buscar por RUT/teléfono, sumar compras y canjear |
| `/admin` | Administrador | Premios, promociones, reglas, marca y personal |
| `/configuracion-inicial` | Primera vez | Crear el primer administrador (se bloquea después) |
| `/terminos` | Todos | Términos del programa y privacidad (borrador) |

## Base de datos

Los archivos de `supabase/migrations/` se pegan, en orden, en el **SQL Editor** de Supabase:

1. `0001_base.sql` — tablas, libro de puntos inmutable, funciones y seguridad (RLS).
2. `0002_storage.sql` — carpeta pública para fotos.

## Variables de entorno

Ver `.env.example`. En Vercel van en *Settings → Environment Variables*.

## Para desarrolladores

```bash
npm install
cp .env.example .env.local   # y completar
npm run dev
```
