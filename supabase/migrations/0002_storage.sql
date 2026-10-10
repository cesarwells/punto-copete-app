-- Migración 0002: carpeta pública para las fotos de premios, promociones y logo.
-- Las fotos se suben desde el servidor (panel admin); cualquiera puede verlas.
insert into storage.buckets (id, name, public)
values ('imagenes', 'imagenes', true)
on conflict (id) do nothing;
