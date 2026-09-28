-- ============================================================================
-- ASTATINE: CANONICAL SUPABASE POSTGRESQL + POSTGIS MIGRATION SCRIPT
-- Project Name: ASTATINE
-- Team: TANTRAKATHA
-- Hackathon: Smart India Hackathon 2026 (SIH 2026) | Problem Statement: SIH26011
-- Target Database: Supabase Managed PostgreSQL 16 + PostGIS 3.4
-- Schema: public
-- Version: 00001
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS SETUP
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- ----------------------------------------------------------------------------
-- 2. ADMINISTRATIVE & SPATIAL JURISDICTIONS
-- ----------------------------------------------------------------------------

-- Cities Table
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    default_srid INTEGER DEFAULT 4326,
    bounds_geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cities_bounds ON public.cities USING GIST(bounds_geom);

-- Regions / Wards Table
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    boundary_geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_regions_city ON public.regions(city_id);
CREATE INDEX IF NOT EXISTS idx_regions_geom ON public.regions USING GIST(boundary_geom);

-- ----------------------------------------------------------------------------
-- 3. PROVENANCE & DATASETS
-- ----------------------------------------------------------------------------

-- Data Sources Table
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(50) NOT NULL,
    trust_level VARCHAR(30) DEFAULT 'AUTHORITATIVE',
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE RESTRICT,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    dataset_type VARCHAR(50) NOT NULL,
    acquisition_date DATE NOT NULL,
    sensor_details VARCHAR(200),
    storage_uri TEXT NOT NULL,
    spatial_coverage GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_datasets_spatial ON public.datasets USING GIST(spatial_coverage);

-- ----------------------------------------------------------------------------
-- 4. CORE VERTICAL PROPERTY HIERARCHY
-- ----------------------------------------------------------------------------

-- Parcels (2D Land Boundaries)
CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
    ulpin_2d VARCHAR(20) UNIQUE NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    recorded_area_sqm NUMERIC(12, 2) NOT NULL,
    computed_area_sqm NUMERIC(12, 2) NOT NULL,
    land_use VARCHAR(50) NOT NULL,
    geom_2d GEOMETRY(Polygon, 4326) NOT NULL,
    elevation_base NUMERIC(8, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcels_ulpin ON public.parcels(ulpin_2d);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON public.parcels USING GIST(geom_2d);

-- Buildings (3D Physical Structures)
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
    building_code VARCHAR(50) NOT NULL,
    name VARCHAR(150),
    building_type VARCHAR(50) NOT NULL,
    footprint_geom GEOMETRY(Polygon, 4326) NOT NULL,
    ground_elevation NUMERIC(8, 2) NOT NULL,
    building_height NUMERIC(8, 2) NOT NULL,
    detected_floors INTEGER NOT NULL,
    sanctioned_floors INTEGER NOT NULL,
    geom_3d GEOMETRY(PolyhedralSurfaceZ, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buildings_parcel ON public.buildings(parcel_id);
CREATE INDEX IF NOT EXISTS idx_buildings_footprint ON public.buildings USING GIST(footprint_geom);
CREATE INDEX IF NOT EXISTS idx_buildings_geom3d ON public.buildings USING GIST(geom_3d);

-- Floors (Vertical Levels)
CREATE TABLE IF NOT EXISTS public.floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_code VARCHAR(20) NOT NULL,
    base_elevation NUMERIC(8, 2) NOT NULL,
    ceiling_elevation NUMERIC(8, 2) NOT NULL,
    floor_height NUMERIC(6, 2) NOT NULL,
    floor_area_sqm NUMERIC(10, 2) NOT NULL,
    geom_3d GEOMETRY(PolyhedralSurfaceZ, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_floors_building ON public.floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_geom3d ON public.floors USING GIST(geom_3d);

-- Units (Vertical 3D Property Units with 3D ULPIN)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
    ulpin_3d VARCHAR(50) UNIQUE NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    carpet_area_sqm NUMERIC(8, 2) NOT NULL,
    spatial_centroid_z GEOMETRY(PointZ, 4326) NOT NULL,
    geom_3d GEOMETRY(PolyhedralSurfaceZ, 4326),
    verification_status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_units_ulpin ON public.units(ulpin_3d);
CREATE INDEX IF NOT EXISTS idx_units_floor ON public.units(floor_id);
CREATE INDEX IF NOT EXISTS idx_units_centroid ON public.units USING GIST(spatial_centroid_z);

-- ----------------------------------------------------------------------------
-- 5. INFRASTRUCTURE & UTILITIES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.infrastructure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    utility_category VARCHAR(50) NOT NULL,
    is_subsurface BOOLEAN NOT NULL DEFAULT FALSE,
    depth_meters NUMERIC(6, 2) DEFAULT 0.0,
    evidence_source_type VARCHAR(30) NOT NULL,
    geom_spatial GEOMETRY(GeometryZ, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_infra_geom ON public.infrastructure USING GIST(geom_spatial);

CREATE TABLE IF NOT EXISTS public.parcel_infrastructure (
    parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
    infrastructure_id UUID NOT NULL REFERENCES public.infrastructure(id) ON DELETE CASCADE,
    intersection_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (parcel_id, infrastructure_id)
);

-- ----------------------------------------------------------------------------
-- 6. EVIDENCE & PROVENANCE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE RESTRICT,
    source_classification VARCHAR(30) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    processing_method VARCHAR(150) NOT NULL,
    model_version VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_entity ON public.evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_dataset ON public.evidence(dataset_id);

-- ----------------------------------------------------------------------------
-- 7. SPATIAL CONFLICTS & DISCREPANCIES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    parcel_id UUID REFERENCES public.parcels(id) ON DELETE SET NULL,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    discrepancy_details JSONB NOT NULL,
    deviation_value NUMERIC(10, 2),
    conflict_geom GEOMETRY(Geometry, 4326),
    status VARCHAR(30) DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conflicts_geom ON public.conflicts USING GIST(conflict_geom);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON public.conflicts(status);

-- ----------------------------------------------------------------------------
-- 8. USERS, VERIFICATION & AUDIT TRAILS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_id UUID REFERENCES public.conflicts(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    officer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    action VARCHAR(30) NOT NULL,
    justification TEXT NOT NULL,
    previous_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_entity ON public.verification_records(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(50),
    prev_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- 9. SUPABASE POSTGIS STORED FUNCTIONS (RPC FOR SPATIAL OPERATIONS)
-- ----------------------------------------------------------------------------

-- Spatial Bounding Box Query for Parcels
CREATE OR REPLACE FUNCTION public.query_parcels_in_bbox(
    min_lon DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lon DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    limit_count INTEGER DEFAULT 100
)
RETURNS SETOF public.parcels
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.parcels
    WHERE geom_2d && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    LIMIT limit_count;
$$;

-- Spatial Bounding Box Query for Buildings
CREATE OR REPLACE FUNCTION public.query_buildings_in_bbox(
    min_lon DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lon DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    limit_count INTEGER DEFAULT 100
)
RETURNS SETOF public.buildings
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.buildings
    WHERE footprint_geom && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    LIMIT limit_count;
$$;

-- Evaluate Building-Parcel Boundary Encroachment
CREATE OR REPLACE FUNCTION public.evaluate_building_parcel_encroachment(
    p_building_id UUID,
    p_parcel_id UUID
)
RETURNS TABLE(
    has_encroachment BOOLEAN,
    encroachment_area_sqm NUMERIC,
    encroachment_geom GEOMETRY,
    severity VARCHAR
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_bld_geom GEOMETRY;
    v_prc_geom GEOMETRY;
    v_diff GEOMETRY;
    v_area NUMERIC;
BEGIN
    SELECT footprint_geom INTO v_bld_geom FROM public.buildings WHERE id = p_building_id;
    SELECT geom_2d INTO v_prc_geom FROM public.parcels WHERE id = p_parcel_id;

    IF v_bld_geom IS NULL OR v_prc_geom IS NULL THEN
        RETURN QUERY SELECT FALSE, 0.0::NUMERIC, NULL::GEOMETRY, 'NONE'::VARCHAR;
        RETURN;
    END IF;

    v_diff := ST_Difference(v_bld_geom, v_prc_geom);
    
    IF v_diff IS NULL OR ST_IsEmpty(v_diff) THEN
        RETURN QUERY SELECT FALSE, 0.0::NUMERIC, NULL::GEOMETRY, 'NONE'::VARCHAR;
    ELSE
        -- Transform to local metric CRS (EPSG:3857) to compute square meters accurately
        v_area := ROUND(ST_Area(ST_Transform(v_diff, 3857))::NUMERIC, 2);
        
        IF v_area > 0.5 THEN
            RETURN QUERY SELECT 
                TRUE, 
                v_area, 
                v_diff, 
                CASE 
                    WHEN v_area <= 2.0 THEN 'LOW'::VARCHAR
                    WHEN v_area <= 10.0 THEN 'MEDIUM'::VARCHAR
                    ELSE 'HIGH'::VARCHAR
                END;
        ELSE
            RETURN QUERY SELECT FALSE, v_area, NULL::GEOMETRY, 'NONE'::VARCHAR;
        END IF;
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Certified Base Spatial Data
CREATE POLICY "Public Read Access on Cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public Read Access on Regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public Read Access on Parcels" ON public.parcels FOR SELECT USING (true);
CREATE POLICY "Public Read Access on Buildings" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "Public Read Access on Floors" ON public.floors FOR SELECT USING (true);
CREATE POLICY "Public Read Access on Units" ON public.units FOR SELECT USING (true);

-- Restricted Policies for Conflicts & Audits (Protected Data)
CREATE POLICY "Authenticated Read Access on Conflicts" ON public.conflicts 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officer Insert/Update on Conflicts" ON public.conflicts 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GOVERNMENT_OFFICER', 'SURVEYOR'));

CREATE POLICY "Authenticated Read Access on Evidence" ON public.evidence 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officer Modification on Verification Records" ON public.verification_records 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GOVERNMENT_OFFICER'));

CREATE POLICY "Audit Trail Append Only" ON public.audit_logs 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Audit Trail Admin Read Only" ON public.audit_logs 
    FOR SELECT TO authenticated 
    USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GOVERNMENT_OFFICER'));
