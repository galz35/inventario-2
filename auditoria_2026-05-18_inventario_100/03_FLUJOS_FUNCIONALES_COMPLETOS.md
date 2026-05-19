# Flujos funcionales completos esperados

Fecha: 2026-05-18

## 1. Flujo solicitante

Actor: cualquier empleado autenticado.

Debe poder:

1. Entrar desde Portal SSO.
2. Ver su perfil basico: carnet, nombre, pais, cargo, jefe.
3. Crear solicitud para si mismo.
4. Buscar articulos permitidos.
5. Agregar lineas con cantidad, talla/sexo cuando aplique.
6. Enviar solicitud.
7. Ver estado:
   - Pendiente
   - Aprobada
   - Parcial
   - Atendida
   - Rechazada
8. Ver historial de su solicitud.
9. Recibir mensaje claro si fue rechazada.

Faltante actual:

- El backend acepta `empleadoCarnet` del body.
- La web no tiene vista "Mis solicitudes".
- No se muestra historial.
- No hay notificaciones.

## 2. Flujo jefe inmediato / jerarquia

Actor: jefe directo, gerente o persona con equipo visible.

Debe poder:

1. Ver pendientes de aprobacion de su equipo.
2. Filtrar por empleado, estado, fecha, gerencia/departamento.
3. Abrir detalle.
4. Ver stock disponible antes de aprobar.
5. Aprobar total o rechazar con motivo.
6. Ver historial de decisiones.

Regla:

- Jefe directo ve `carnet_jefe1`.
- Jerarquia superior ve `carnet_jefe2..4`.
- Delegado puede ver si hay delegacion activa.
- `DENY` bloquea acceso.

Faltante actual:

- No existe visibilidad jerarquica en Inventario.
- Aprobacion compara solo `JefeCarnet` directo o `RRHH_APRUEBA`.
- UI no distingue "pendientes de mi equipo".

## 3. Flujo RRHH aprobador

Actor: rol `RRHH_APRUEBA`.

Debe poder:

1. Ver solicitudes de su pais/area autorizada.
2. Aprobar o rechazar.
3. Crear solicitud para otro empleado si esta permitido.
4. Consultar consumo por gerencia/departamento.
5. Consultar historial.

Faltante actual:

- No hay permisos por area.
- No hay reportes RRHH.
- No hay crear en nombre de otro con control formal.

## 4. Flujo bodega

Actor: rol `BODEGA`.

Debe poder:

1. Ver todos los pendientes aprobados/parciales de su pais/almacen.
2. Abrir una solicitud.
3. Ver lineas, stock por variante y lote FEFO.
4. Despachar total o parcial por linea.
5. Confirmar antes de afectar stock.
6. Registrar evidencia si la politica lo exige.
7. Ver resultado:
   - Atendida si todo se entrego.
   - Parcial si falta algo.
8. Registrar entrada, merma y transferencia.
9. Consultar kardex.
10. Ver alertas de stock bajo y vencimientos.

Faltante actual:

- Web solo ofrece "Despachar Todo".
- No hay despacho parcial controlado en UI.
- No hay entrada/merma UI.
- No hay transferencia UI aunque `update_db_v2.js` tiene SP.
- Evidencia solo existe en movil localmente, no backend.
- No hay pantalla de lotes/vencimientos.

## 5. Flujo administrador

Actor: rol `ADMIN`.

Debe poder:

1. Ver todo.
2. Administrar roles.
3. Administrar almacenes.
4. Administrar articulos.
5. Configurar stock minimo.
6. Configurar permisos/delegaciones.
7. Ver auditoria.
8. Ejecutar smoke/diagnostico o ver estado del sistema.

Faltante actual:

- No hay UI admin.
- `ADMIN` no es superrol en `RolesGuard`.
- No hay endpoints admin expuestos en NestJS salvo SPs en `update_db_v2.js` que no estan cableados.

## 6. Flujo auditoria/kardex

Actor: Bodega, Admin, RRHH autorizado.

Debe poder:

1. Filtrar por almacen.
2. Filtrar por fecha.
3. Filtrar por tipo: entrada, salida, merma, transferencia.
4. Filtrar por articulo.
5. Filtrar por carnet destino.
6. Filtrar por solicitud.
7. Exportar Excel.
8. Ver usuario responsable.
9. Ver lote y vencimiento.

Faltante actual:

- Kardex UI solo fecha y almacen.
- No filtra por articulo/tipo/carnet/solicitud.
- No hay reporte de auditoria general.

## 7. Flujo movil

Actor principal: Bodega.

Debe poder:

1. Login.
2. Ver pendientes reales por pais/almacen.
3. Escanear codigo.
4. Abrir detalle real.
5. Marcar lineas entregadas.
6. Ajustar cantidades.
7. Tomar evidencia si se soporta.
8. Despachar.
9. Sincronizar resultado.

Faltante actual:

- No validado con Flutter.
- `idAlmacen=1`.
- Parseo detalle incompatible.
- Foto no se sube.
- Refresh token no existe.

## 8. Flujo operativo avanzado recomendado

Una sola pantalla puede hacer mucho si se estructura asi:

- Sidebar: modulos.
- Barra superior: pais, almacen, alcance, buscador global.
- Centro: tabla principal.
- Panel derecho/drawer: detalle contextual.
- Footer/toolbar: acciones masivas si aplica.

Acciones por tab:

- Monitor: KPIs, alertas, pendientes.
- Solicitudes: crear, aprobar, rechazar, historial.
- Bodega: despacho parcial/total, evidencia, FEFO.
- Stock: entradas, mermas, transferencia, stock minimo.
- Kardex: auditoria y export.
- Admin: roles, permisos, catalogos.

## 9. Criterio de flujo completo

No aceptar como terminado hasta demostrar:

1. Crear solicitud como empleado.
2. Aprobar como jefe por jerarquia.
3. Rechazar como RRHH.
4. Despachar parcial como bodega.
5. Despachar restante y dejar atendida.
6. Ver stock descontado.
7. Ver kardex con responsable, destino y solicitud.
8. Exportar reporte.
9. Ver que un usuario sin permiso no accede.
