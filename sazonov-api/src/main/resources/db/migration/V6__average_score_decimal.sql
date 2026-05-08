ALTER TABLE admission_applications
    ALTER COLUMN points TYPE NUMERIC(3,2)
    USING CASE
        WHEN points > 5 THEN ROUND(points / 50.0, 2)
        ELSE ROUND(points::numeric, 2)
    END;
