/* =========================================================
   00_EMP2024_LOCAL.sql
   Crear tabla local dbo.EMP2024 (para que migres datos)
========================================================= */
IF OBJECT_ID('dbo.EMP2024','U') IS NOT NULL
    DROP TABLE dbo.EMP2024;
GO

CREATE TABLE dbo.EMP2024
(
    idhcm              INT            NULL,
    Idhrms             INT            NULL,
    idhcm2             INT            NULL,
    LVL                INT            NULL,
    userlvl            INT            NULL,
    carnet             VARCHAR(20)    NOT NULL,
    carnet2            VARCHAR(20)    NULL,
    nombre_completo    VARCHAR(200)   NULL,
    correo             VARCHAR(200)   NULL,
    cargo              VARCHAR(200)   NULL,
    empresa            VARCHAR(200)   NULL,
    cedula             VARCHAR(30)    NULL,
    Departamento       VARCHAR(200)   NULL,
    Direccion          VARCHAR(200)   NULL,
    Nombreubicacion    VARCHAR(200)   NULL,
    datos              VARCHAR(500)   NULL,
    fechaingreso       DATE           NULL,
    fechabaja          DATE           NULL,
    fechaasignacion    DATE           NULL,
    ActionCode         VARCHAR(60)    NULL,
    diaprueba          INT            NULL,
    oDEPARTAMENTO      VARCHAR(250)   NULL,
    OGERENCIA          VARCHAR(250)   NULL,
    oSUBGERENCIA       VARCHAR(250)   NULL,
    ManagerLevel       VARCHAR(60)    NULL,
    telefono           VARCHAR(30)    NULL,
    telefonojefe       VARCHAR(30)    NULL,
    nom_jefe1          VARCHAR(200)   NULL,
    correo_jefe1       VARCHAR(200)   NULL,
    cargo_jefe1        VARCHAR(200)   NULL,
    idhcm_jefe1        INT            NULL,
    carnet_jefe1       VARCHAR(20)    NULL,
    o1                 VARCHAR(250)   NULL,
    nom_jefe2          VARCHAR(200)   NULL,
    correo_jefe2       VARCHAR(200)   NULL,
    cargo_jefe2        VARCHAR(200)   NULL,
    idhcm_jefe2        INT            NULL,
    carnet_jefe2       VARCHAR(20)    NULL,
    o2                 VARCHAR(250)   NULL,
    nom_jefe3          VARCHAR(200)   NULL,
    correo_jefe3       VARCHAR(200)   NULL,
    cargo_jefe3        VARCHAR(200)   NULL,
    idhcm_jefe3        INT            NULL,
    carnet_jefe3       VARCHAR(20)    NULL,
    o3                 VARCHAR(250)   NULL,
    nom_jefe4          VARCHAR(200)   NULL,
    correo_jefe4       VARCHAR(200)   NULL,
    cargo_jefe4        VARCHAR(200)   NULL,
    idhcm_jefe4        INT            NULL,
    carnet_jefe4       VARCHAR(20)    NULL,
    o4                 VARCHAR(250)   NULL,
    SUBGERENTECORREO   VARCHAR(200)   NULL,
    SUBGERENTE         VARCHAR(200)   NULL,
    GERENTECORREO      VARCHAR(200)   NULL,
    GERENTE            VARCHAR(200)   NULL,
    GERENTECARNET      VARCHAR(20)    NULL,
    pais               VARCHAR(10)    NULL,
    organizacion       VARCHAR(250)   NULL,
    jefe               VARCHAR(200)   NULL,
    userlevel          VARCHAR(60)    NULL,
    idorg              VARCHAR(60)    NULL,
    primernivel        VARCHAR(250)   NULL,
    nivel              VARCHAR(250)   NULL,
    padre              VARCHAR(250)   NULL,
    segundo_nivel      VARCHAR(250)   NULL,
    tercer_nivel       VARCHAR(250)   NULL,
    cuarto_nivel       VARCHAR(250)   NULL,
    quinto_nivel       VARCHAR(250)   NULL,
    sexto_nivel        VARCHAR(250)   NULL,
    WorkMobilePhoneNumber VARCHAR(30) NULL,
    Gender             VARCHAR(10)    NULL,
    UserNam            VARCHAR(200)   NULL,
    foto               VARCHAR(1000)  NULL,
    o5                 VARCHAR(250)   NULL,
    o6                 VARCHAR(250)   NULL,
    fechanacimiento    DATE           NULL,
    IDORG_TRIM         VARCHAR(60)    NULL,

    CONSTRAINT PK_EMP2024 PRIMARY KEY (carnet)
);
GO

CREATE INDEX IX_EMP2024_Nombre ON dbo.EMP2024(nombre_completo) INCLUDE(correo,cargo,pais,fechabaja);
CREATE INDEX IX_EMP2024_Pais   ON dbo.EMP2024(pais) INCLUDE(carnet,nombre_completo,correo,fechabaja);
CREATE INDEX IX_EMP2024_Jefe1  ON dbo.EMP2024(carnet_jefe1) INCLUDE(carnet,nombre_completo,correo,cargo);
GO
