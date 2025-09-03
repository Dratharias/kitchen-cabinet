-- =========================================================
-- INSERT CATEGORIES
-- =========================================================
INSERT INTO Category (strValue, type) VALUES
('Fruit', 'FoodGroup'),
('Légume', 'FoodGroup'),
('Viande', 'FoodGroup'),
('Poisson', 'FoodGroup'),
('Épice', 'FoodGroup'),
('Produit laitier', 'FoodGroup'),
('Céréale', 'FoodGroup'),
('Légumineuse', 'FoodGroup'),
('Noix & graines', 'FoodGroup'),
('Boisson', 'FoodGroup');

-- =========================================================
-- INSERT MACRO + PRODUCT
-- (Values are per 100 g, approximations based on USDA/FDC)
-- =========================================================

-- Fraises / Strawberries
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (32, 1, 2, 4, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Fraises', 'Strawberries', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Fruit')
FROM ins;

-- Poitrine de poulet / Chicken breast
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (165, 31, 0, 0, 1, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Poitrine de poulet', 'Chicken breast', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Viande')
FROM ins;

-- Pomme / Apple
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (52, 0, 2, 10, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Pomme', 'Apple', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Fruit')
FROM ins;

-- Brocoli / Broccoli
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (34, 3, 3, 2, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Brocoli', 'Broccoli', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Légume')
FROM ins;

-- Riz blanc / White rice
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (130, 2, 0, 0, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Riz blanc', 'White rice', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Céréale')
FROM ins;

-- Amandes / Almonds
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (579, 21, 12, 4, 4, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Amandes', 'Almonds', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Noix & graines')
FROM ins;

-- Saumon / Salmon
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (208, 20, 0, 0, 3, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Saumon', 'Salmon', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Poisson')
FROM ins;

-- Lait / Milk
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (42, 3, 0, 5, 1, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Lait', 'Milk', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Produit laitier')
FROM ins;

-- Œuf / Egg
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (155, 13, 0, 1, 3, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Œuf', 'Egg', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Produit laitier')
FROM ins;

-- Cannelle / Cinnamon
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (247, 4, 54, 2, 1, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Cannelle', 'Cinnamon', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Épice')
FROM ins;

-- Banane / Banana
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (89, 1, 2, 12, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Banane', 'Banana', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Fruit')
FROM ins;

-- Orange / Orange
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (47, 1, 2, 9, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Orange', 'Orange', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Fruit')
FROM ins;

-- Carotte / Carrot
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (41, 1, 3, 5, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Carotte', 'Carrot', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Légume')
FROM ins;

-- Lentilles / Lentils
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (116, 9, 8, 2, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Lentilles', 'Lentils', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Légumineuse')
FROM ins;

-- Pois chiches / Chickpeas
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (164, 9, 8, 3, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Pois chiches', 'Chickpeas', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Légumineuse')
FROM ins;

-- Noix de cajou / Cashews
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (553, 18, 3, 6, 8, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Noix de cajou', 'Cashews', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Noix & graines')
FROM ins;

-- Pain complet / Whole wheat bread
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (247, 13, 7, 4, 1, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Pain complet', 'Whole wheat bread', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Céréale')
FROM ins;

-- Fromage cheddar / Cheddar cheese
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (403, 25, 0, 0, 21, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Fromage cheddar', 'Cheddar cheese', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Produit laitier')
FROM ins;

-- Thon / Tuna
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (132, 28, 0, 0, 1, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Thon', 'Tuna', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Poisson')
FROM ins;

-- Café noir / Black coffee
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (1, 0, 0, 0, 0, 0, 95) -- caféine mg approximatif
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Café noir', 'Black coffee', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Boisson')
FROM ins;

-- Vin rouge / Red wine
WITH ins AS (
    INSERT INTO Macro (calories, protein, fiber, sugar, saturated, trans, caffein)
    VALUES (85, 0, 0, 1, 0, 0, 0)
    RETURNING macroId
)
INSERT INTO Product (name, enName, macro, category)
SELECT 'Vin rouge', 'Red wine', macroId,
       (SELECT categoryId FROM Category WHERE strValue = 'Boisson')
FROM ins;

