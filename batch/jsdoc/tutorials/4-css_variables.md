Para definir el estilo visual de los controles de la API SITNA se utilizan variables CSS. 
Estas variables permiten definir valores reutilizables para propiedades CSS, facilitando la personalización y el 
mantenimiento del estilo de la interfaz de usuario. En [este ejemplo](../examples/css.variables.html) se muestra cómo afectan estas variables CSS a los
elementos de la interfaz de usuario de la API SITNA. Con él se pueden crear temas personalizados para la interfaz de usuario.

A continuación se muestran tablas con las variables CSS utilizadas en la API SITNA en distintos ámbitos, 
junto con su descripción y valor por defecto:

## Variables CSS de ámbito general

| Variable CSS                               | Descripción                                                                   | Valor por defecto                                                                   |
|--------------------------------------------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `--sitna-text-font-family`                 | Familia tipográfica de los textos                                             | `sans-serif`                                                                        |
| `--sitna-text-color`                       | Color de los textos                                                           | `#333333`                                                                           |
| `--sitna-background-color`                 | Color de fondo por defecto                                                    | `#ffffff`                                                                           |
| `--sitna-main-accent-color`                | Color de resalte principal                                                    | `#cc0000`                                                                           |
| `--sitna-main-accent-contrast-color`       | Color de contraste para el de resalte principal                               | `#ffffff`                                                                           |
| `--sitna-secondary-accent-color`           | Color de resalte secundario                                                   | `#555555`                                                                           |
| `--sitna-secondary-accent-contrast-color`  | Color de contraste para el de resalte secundario                              | `#ffffff`                                                                           |
| `--sitna-highlighted-text-color`           | Color de texto resaltado                                                      | `#000000`                                                                           |
| `--sitna-icon-font-family`                 | Familia tipográfica de los iconos                                             | `sitna`                                                                             |
| `--sitna-icon-text`                        | Texto que representa un icono; a definir en cada contexto                     |                                                                                     |
| `--sitna-icon-text-line-height`            | Altura de línea del texto que representa un icono                             | `1.5em`                                                                             |
| `--sitna-border-radius`                    | Radio de las esquinas de los elementos de bloque                              | `0.3rem`                                                                            |
| `--sitna-link-color`                       | Color de los enlaces de hipertexto                                            | `#cc0000`                                                                           |
| `--sitna-link-decoration`                  | Valor de `text-decoration` en los enlaces de hipertexto                       | `underline`                                                                         |
| `--sitna-textbox-text-color`               | Color de los caracteres de las cajas de texto                                 | `var(--sitna-highlighted-text-color)`                                               |
| `--sitna-textbox-background-color`         | Color de fondo de las cajas de texto                                          | `var(--sitna-background-color)`                                                     |
| `--sitna-textbox-border-color`             | Color de borde de las cajas de texto                                          | `color-mix(in srgb, var(--sitna-background-color) 75%, var(--sitna-text-color))`    |
| `--sitna-even-row-background-color`        | Color de fondo de una fila par en una tabla                                   | `var(--sitna-background-color)`                                                     |
| `--sitna-odd-row-background-color`         | Color de fondo de una fila impar en una tabla                                 | `color-mix(in srgb, var(--sitna-background-color) 91.67%, var(--sitna-text-color))` |

## Variables CSS para botones ({@link SITNA.ui.Button})

| Variable CSS                               | Descripción                                               | Valor por defecto                                                                   |
|--------------------------------------------|-----------------------------------------------------------|-------------------------------------------------------------------------------------|
| `--sitna-button-text-color`                | Color de texto del botón en su variante por defecto       | `var(--sitna-secondary-accent-contrast-color)`                                      |
| `--sitna-button-background-color`          | Color de fondo del botón en su variante por defecto       | `var(--sitna-secondary-accent-color)`                                               |
| `--sitna-button-border-color`              | Color del borde del botón en su variante por defecto      | `var(--sitna-secondary-accent-color)`                                               |
| `--sitna-active-button-text-color`         | Color de texto del botón activo                           | `var(--sitna-main-accent-contrast-color)`                                           |
| `--sitna-active-button-background-color`   | Color de fondo del botón activo                           | `var(--sitna-main-accent-color)`                                                    |
| `--sitna-active-button-border-color`       | Color del borde del botón activo                          | `var(--sitna-main-accent-color)`                                                    |
| `--sitna-disabled-button-text-color`       | Color de texto del botón deshabilitado                    | `var(--sitna-secondary-accent-contrast-color)`                                      |
| `--sitna-disabled-button-background-color` | Color de fondo del botón deshabilitado                    | `color-mix(in srgb, var(--sitna-background-color) 75%, var(--sitna-text-color))`    |
| `--sitna-disabled-button-border-color`     | Color del borde del botón deshabilitado                   | `color-mix(in srgb, var(--sitna-background-color) 75%, var(--sitna-text-color))`    |
| `--sitna-minimal-button-text-color`        | Color de texto del botón en variante `minimal`            | `var(--sitna-highlighted-text-color)`                                               |
| `--sitna-minimal-button-background-color`  | Color de fondo del botón en variante `minimal`            | `color-mix(in srgb, var(--sitna-background-color) 83.33%, var(--sitna-text-color))` |
| `--sitna-active-minimal-button-text-color` | Color de texto del botón activo en variante `minimal`     | `var(--sitna-main-accent-color)`                                                    |
| `--sitna-button-font-weight`               | Grosor del texto del botón                                | `normal`                                                                            |

## Variables CSS para conmutadores ({@link SITNA.ui.Toggle})

| Variable CSS                                      | Descripción                                                                       | Valor por defecto                                                                |
|---------------------------------------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| `--sitna-checkbox-icon-color`                     | Color del icono dentro de un conmutador                                           | `var(--sitna-highlighted-text-color)`                                            |
| `--sitna-checkbox-background-color`               | Color del fondo de una casilla de verificación                                    | `var(--sitna-background-color)`                                                  |
| `--sitna-checkbox-border-color`                   | Color del borde de una casilla de verificación                                    | `color-mix(in srgb, var(--sitna-background-color) 50%, var(--sitna-text-color))` |
| `--sitna-checked-checkbox-icon-color`             | Color del icono dentro de un conmutador activado                                  | `var(--sitna-main-accent-contrast-color)`                                        |
| `--sitna-checked-checkbox-background-color`       | Color del fondo de un conmutador activado                                         | `var(--sitna-main-accent-color)`                                                 |
| `--sitna-checked-checkbox-border-color`           | Color del borde de un conmutador activado                                         | `var(--sitna-main-accent-color)`                                                 |
| `--sitna-indeterminate-checkbox-icon-color`       | Color del icono dentro de una casilla de verificación en estado indefinido        | `var(--sitna-highlighted-text-color)`                                            | 
| `--sitna-indeterminate-checkbox-background-color` | Color del fondo de una casilla de verificación en estado indefinido               | `color-mix(in srgb, var(--sitna-background-color) 75%, var(--sitna-text-color))` | 
| `--sitna-indeterminate-checkbox-border-color`     | Color del borde de una casilla de verificación en estado indefinido               | `color-mix(in srgb, var(--sitna-background-color) 50%, var(--sitna-text-color))` | 
| `--sitna-checked-icon-text`                       | Texto que representa el icono de un conmutador activado                           | `'\2714\fe0e'` (✔)                                                               |
| `--sitna-unchecked-icon-text`                     | Texto que representa el icono de un conmutador desactivado                        | `''`                                                                             | 
| `--sitna-indeterminate-icon-text`                 | Texto que representa el icono de una casilla de verificación en estado indefinido | `'?'`                                                                            | 

## Variables CSS para pestañas ({@link SITNA.ui.Tab})

| Variable CSS                               | Descripción                                                                       | Valor por defecto                                                                   |
|--------------------------------------------|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `--sitna-tab-text-color`                   | Color del texto de la pestaña sin seleccionar                                     | `color-mix(in srgb, var(--sitna-background-color) 25%, var(--sitna-text-color))`    | 
| `--sitna-tab-background-color`             | Color del fondo de la pestaña sin seleccionar                                     | `color-mix(in srgb, var(--sitna-background-color) 88.89%, var(--sitna-text-color))` | 
| `--sitna-tab-border-color`                 | Color del borde de la pestaña sin seleccionar                                     | `color-mix(in srgb, var(--sitna-background-color) 50%, var(--sitna-text-color))`    | 
| `--sitna-selected-tab-text-color`          | Color del texto de la pestaña seleccionada                                        | `color-mix(in srgb, var(--sitna-background-color) 25%, var(--sitna-text-color))`    | 
| `--sitna-selected-tab-background-color`    | Color del fondo de la pestaña seleccionada                                        | `var(--sitna-background-color)`                                                     | 
| `--sitna-selected-tab-border-color`        | Color del borde de la pestaña seleccionada                                        | `color-mix(in srgb, var(--sitna-background-color) 25%, var(--sitna-text-color))`    | 
| `--sitna-disabled-tab-text-color`          | Color del texto de una pestaña deshabilitada                                      | `color-mix(in srgb, var(--sitna-background-color) 75%, var(--sitna-text-color))`    | 
| `--sitna-disabled-tab-background-color`    | Color del fondo de una pestaña deshabilitada                                      | `transparent`                                                                       | 
| `--sitna-disabled-tab-border-color`        | Color del borde de una pestaña deshabilitada                                      | `color-mix(in srgb, var(--sitna-background-color) 88.89%, var(--sitna-text-color))` | 
| `--sitna-selected-tab-font-weight`         | Grosor del texto de la pestaña seleccionada                                       | `bold`                                                                              | 
| `--sitna-tab-inner-border-radius`          | Radio de las esquinas interiores de las pestañas dentro de un grupo               | `0.3rem`                                                                            | 
