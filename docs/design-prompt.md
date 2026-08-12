# Prompt de diseño — Umbral Training (dashboard completo)

> Pega este prompt en Claude para generar un artifact React con el diseño de todas las
> pantallas. Actualizado para **triatlón** (nado/bici/carrera), **gimnasio/fuerza** y
> **repeticiones anidadas**.

```text
Diseña la interfaz completa de "Umbral Training", un dashboard interno en español para una
entrenadora de running, triatlón y gimnasio (fuerza) que gestiona a sus atletas. Genera un
ÚNICO artifact React
autocontenido, navegable entre pantallas (con estado, tipo router), usando Tailwind, componentes
al estilo shadcn/ui, iconos lucide-react y gráficas con Recharts. Datos mock en español (nombres,
marcas, carreras). Unidades métricas. Soporta modo claro y oscuro. Sin backend: datos en memoria.

## Concepto de marca
"Umbral" = umbral de rendimiento (lactate threshold). Estética atlética, limpia y moderna,
inspirada en el editor de entrenos de Garmin Connect (mucho blanco, azul de marca, barras de
intensidad, badges de estado) pero más refinada, al nivel de un producto shadcn.

## Disciplinas
La app cubre 4 disciplinas: Natación (swim), Ciclismo (bike), Carrera (run) y Gimnasio/fuerza
(gym). Usa un color/ícono consistente por disciplina en toda la app:
- Natación: cian, ícono de olas/gota.
- Ciclismo: naranja/ámbar, ícono de bici.
- Carrera: azul primario, ícono de corredor.
- Gimnasio: magenta, ícono de mancuerna.
Los entrenos, pasos y objetivos se etiquetan por disciplina. Un plan puede combinar las cuatro.
IMPORTANTE: gimnasio es una disciplina de FUERZA, su entreno NO se estructura como intervalos de
distancia/ritmo, sino como ejercicios con series × repeticiones × carga (kg) — ver constructor.

## Sistema de diseño (define tokens y úsalos en todo)
- Primario: azul #2563EB (hover #1D4ED8). Fondo claro #F8FAFC, superficies blancas, borde #E2E8F0.
- Texto #0F172A, secundario #64748B.
- Estados: pagado/éxito #16A34A, pendiente #D97706, gratis #7C3AED, peligro #DC2626.
- Disciplinas: swim #06B6D4, bike #F97316, run #2563EB, gym #DB2777.
- Dark: fondo #0B1220, superficies #1E293B, bordes #334155, texto #E2E8F0.
- Tipografía Inter. Números tabulares (tabular-nums) para tiempos, marcas y métricas.
- Radios: 14px cards, 8px inputs/botones. Sombras suaves. Densidad cómoda pero informativa.

## Shell / layout
- Sidebar izquierda con logo "Umbral Training" y navegación: Dashboard, Atletas, Entrenos, Pagos,
  Ajustes. Ítem activo resaltado.
- Topbar: buscador, toggle claro/oscuro, avatar de la entrenadora (rol Coach).
- Responsive: sidebar colapsable en móvil.

## Pantallas a diseñar

1) DASHBOARD (home)
   - Fila de KPIs: Nº de atletas, atletas activos, pagos pendientes, próximas carreras.
   - "Próximas sesiones" (atleta, disciplina con su color/ícono, tipo de entreno, fecha).
   - "Carreras objetivo próximas" (atleta, carrera, tipo —10k / 21k / triatlón sprint / 70.3—, fecha,
     cuenta regresiva).
   - Gráfica de volumen/carga semanal del grupo por disciplina (Recharts, apilado).

2) ATLETAS (lista)
   - Cards o tabla con: avatar+nombre, objetivo (badge: "Carrera" con nombre/fecha, o "Mantenimiento"),
     estado de pago (badge: Pagado / Pendiente / Gratis), disciplinas que entrena (chips), y mejores
     marcas resumidas.
   - Botón "Invitar atleta" (por email). Filtros por estado de pago, objetivo y disciplina.

3) ATLETA (detalle)
   - Cabecera con nombre, objetivo y estado de pago/membresía.
   - Tarjeta de MARCAS: tiempos de carrera 1K, 5K, 10K, 21K — TODAS OPCIONALES (muestra "Sin registro"
     cuando falta). Cada marca con fecha y mini histórico (sparkline). Deja espacio para métricas de
     otras disciplinas (ritmo /100m en nado, velocidad/potencia en bici) en una sección extensible.
   - Tarjeta de OBJETIVO: si es carrera → nombre, tipo/distancia, fecha, días restantes y ritmo objetivo;
     si es mantenimiento → indicarlo claramente.
   - Tarjeta de PAGO/MEMBRESÍA: modo (Manual / Gratis / Pasarela próximamente), monto mensual del atleta,
     periodo actual, estado, botón "Marcar como pagado".
   - Lista de entrenos asignados (con su disciplina) con acceso a abrir el constructor o el PDF.

4) CONSTRUCTOR DE ENTRENOS (referencia principal: Garmin Connect workout builder)
   - Encabezado editable con nombre del entreno (ej. "Series 400") y selector de DISCIPLINA
     (nado/bici/carrera/gimnasio) que ajusta la estructura y el tipo de objetivo de los pasos.
   - VARIANTE RESISTENCIA (nado/bici/carrera):
     - Botones "Añadir paso" y "Añadir repetición".
     - Visualización de barras de intensidad arriba (altura = intensidad; descansos más bajos), como Garmin.
     - Bloques anidables: "Repetir N veces" puede contener pasos Y otras repeticiones (SOPORTA ANIDACIÓN
       para pirámides/sets complejos), con indentación visual clara de la jerarquía.
     - Cada paso: tipo (Correr/Nadar/Pedalear/Descanso), distancia o tiempo, y objetivo de intensidad según
       disciplina (ritmo /km en carrera, /100m en nado, velocidad o potencia en bici; con rango, ej. 4:30–4:40 /km).
       Menú de opciones (⋮) y reordenable.
   - VARIANTE GIMNASIO/FUERZA:
     - En vez de intervalos, se estructura por EJERCICIOS. Botón "Añadir ejercicio" (y opción de agruparlos
       en "superserie/circuito", que también admite repetición/rondas).
     - Cada ejercicio: nombre (ej. Sentadilla, Peso muerto), series × repeticiones, carga en kg (o "peso corporal"),
       RIR/RPE opcional, y descanso entre series. Menú (⋮) y reordenable.
     - Sin barras de intensidad; muestra un resumen de volumen (nº de series totales, tonelaje estimado si hay carga).
   - Panel derecho: Tiempo estimado, y según disciplina Distancia estimada (resistencia) o Volumen/series (gimnasio),
     Notas, y placeholder de nota de audio.
   - Botones "Cancelar" y "Guardar entreno".

5) PDF DEL ENTRENO (vista previa)
   - Render bonito y simplificado para que el atleta lo entienda: cabecera con marca Umbral, nombre del
     atleta y del entreno, disciplina, resumen y la lista de pasos/ejercicios en formato claro y no técnico.
     Resistencia → pasos/series con distancia/ritmo (incluida la anidación). Gimnasio → ejercicios con
     series × reps × carga y descansos.
   - Botones "Descargar PDF" y, marcados como próximamente, "Enviar por correo" / "Compartir".

6) PAGOS
   - Tabla de atletas con: nombre, modo (Manual/Gratis/Pasarela), monto mensual, periodo, estado
     (Pagado/Pendiente/Gratis), acciones "Marcar pagado" y placeholder "Cobrar con pasarela (próximamente)".
   - Resumen arriba: cobrado del mes, pendiente, nº de atletas gratuitos.

## Interacción y calidad
- Navegación real entre las 6 pantallas. Estados hover/activo, badges consistentes, tablas legibles.
- Accesibilidad básica (contraste, foco visible, labels).
- Cuida el detalle: alineación, jerarquía tipográfica, números tabulares en tiempos y marcas, y la
  indentación de repeticiones anidadas en el constructor.
```
