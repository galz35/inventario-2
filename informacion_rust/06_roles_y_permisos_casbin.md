# Roles y Permisos Enterprise: Casbin-rs + Axum

En un entorno regional para Claro, los roles deben ser granulares y seguros. No todos pueden ver todo.

## 1. Definición de Roles Clave
Para el sistema de Inventario de RRHH, hemos identificado estos niveles:

| Rol | Acción Permitida | Alcance |
| :--- | :--- | :--- |
| **Bodeguero** | Recibir, Almacenar, Despachar Activos. | Almacén Específico. |
| **Empleado** | Solicitar Equipamiento, Ver su propio inventario. | Personal. |
| **Gerente de País** | Ver reportes de todo el país, aprobar solicitudes. | País Completo. |
| **Auditor Regional** | Ver inventario de múltiples países (Solo lectura). | Regional (Varios países). |
| **Admin IT** | Gestión técnica del sistema. | Global. |

## 2. Implementación en Rust: Casbin-rs
Usaremos la librería **Casbin-rs** para el control de acceso. Es el estándar de la industria porque separa la lógica de los permisos del código fuente.

### Modelo de Permisos (RBAC con Dominios):
```toml
# casbin_model.conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[matcher]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
```
*Donde `dom` es el País (Nicaragua, Honduras, etc.).*

## 3. Flujo de Solicitud y Bodega
1.  **Empleado (Nicaragua):** Genera una `Solicitud` de un Laptop Dell.
2.  **Notificación:** El `Bodeguero (Nicaragua)` recibe una alerta en su sistema.
3.  **Procesamiento:** El Bodeguero escanea el código del Laptop para asociarlo al empleado.
4.  **Confirmación:** La `Solicitud` cambia a estado "Entregado".

## 4. Auditoría de Seguridad (Trazabilidad)
Cada acción de un Bodeguero o Empleado se registra en una tabla de `Logs`. Rust permite que estos registros se escriban de forma asíncrona rápidamente, sin retrasar la interfaz del usuario.

| Timestamp | Usuario | Acción | País | ID_Activo |
| :--- | :--- | :--- | :--- | :--- |
| 2026-03-05 11:40 | bodeguero_ni | DESPACHO | NI | LAP-001 |

---
> [!NOTE]
> **Privacidad Local:** Aunque el sistema sea regional, los datos personales de empleados están protegidos bajo las leyes locales de cada país, gracias al aislamiento forzado de Rust y SQL Server.
