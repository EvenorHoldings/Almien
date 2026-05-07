export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_queue: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_value: number | null
          alert_type: string
          auto_expire_at: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          threshold_value: number | null
          title: string
          ward_id: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number | null
          alert_type: string
          auto_expire_at?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          threshold_value?: number | null
          title: string
          ward_id?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number | null
          alert_type?: string
          auto_expire_at?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          threshold_value?: number | null
          title?: string
          ward_id?: number | null
        }
        Relationships: []
      }
      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          endpoint: string
          expires_at: string
          id: string
          source: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          endpoint: string
          expires_at: string
          id?: string
          source: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          endpoint?: string
          expires_at?: string
          id?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          query_params: Json | null
          request_path: string | null
          resource_id: string | null
          resource_type: string
          result: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          query_params?: Json | null
          request_path?: string | null
          resource_id?: string | null
          resource_type: string
          result?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          query_params?: Json | null
          request_path?: string | null
          resource_id?: string | null
          resource_type?: string
          result?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      beaches: {
        Row: {
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          current_conditions: string | null
          id: string
          is_open: boolean
          last_updated: string
          lifeguard_on_duty: boolean
          location: string
          name: string
          shark_flag_status: string
          water_quality: string
          water_temp_celsius: number | null
          wind_speed_kmh: number | null
        }
        Insert: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          current_conditions?: string | null
          id?: string
          is_open?: boolean
          last_updated?: string
          lifeguard_on_duty?: boolean
          location: string
          name: string
          shark_flag_status?: string
          water_quality?: string
          water_temp_celsius?: number | null
          wind_speed_kmh?: number | null
        }
        Update: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          current_conditions?: string | null
          id?: string
          is_open?: boolean
          last_updated?: string
          lifeguard_on_duty?: boolean
          location?: string
          name?: string
          shark_flag_status?: string
          water_quality?: string
          water_temp_celsius?: number | null
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
      cctv_assets: {
        Row: {
          area_code: string | null
          camera_code: string
          camera_type: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          has_night_vision: boolean | null
          id: string
          installed_date: string | null
          last_maintenance: string | null
          location: string
          municipality: string | null
          name: string
          owner: string | null
          recording_enabled: boolean | null
          resolution: string | null
          status: string
          street: string | null
          suburb: string | null
          updated_at: string
          ward_id: number | null
        }
        Insert: {
          area_code?: string | null
          camera_code: string
          camera_type?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          has_night_vision?: boolean | null
          id?: string
          installed_date?: string | null
          last_maintenance?: string | null
          location: string
          municipality?: string | null
          name: string
          owner?: string | null
          recording_enabled?: boolean | null
          resolution?: string | null
          status?: string
          street?: string | null
          suburb?: string | null
          updated_at?: string
          ward_id?: number | null
        }
        Update: {
          area_code?: string | null
          camera_code?: string
          camera_type?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          has_night_vision?: boolean | null
          id?: string
          installed_date?: string | null
          last_maintenance?: string | null
          location?: string
          municipality?: string | null
          name?: string
          owner?: string | null
          recording_enabled?: boolean | null
          resolution?: string | null
          status?: string
          street?: string | null
          suburb?: string | null
          updated_at?: string
          ward_id?: number | null
        }
        Relationships: []
      }
      citizen_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          infrastructure_type: string | null
          latitude: number | null
          longitude: number | null
          report_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          infrastructure_type?: string | null
          latitude?: number | null
          longitude?: number | null
          report_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          infrastructure_type?: string | null
          latitude?: number | null
          longitude?: number | null
          report_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_kpis: {
        Row: {
          category: string
          created_at: string
          current_value: number
          id: string
          kpi_code: string
          kpi_name: string
          last_updated: string
          period: string
          period_end: string
          period_start: string
          previous_value: number | null
          target_value: number | null
          trend: string | null
          trend_percent: number | null
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          current_value: number
          id?: string
          kpi_code: string
          kpi_name: string
          last_updated?: string
          period: string
          period_end: string
          period_start: string
          previous_value?: number | null
          target_value?: number | null
          trend?: string | null
          trend_percent?: number | null
          unit: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: number
          id?: string
          kpi_code?: string
          kpi_name?: string
          last_updated?: string
          period?: string
          period_end?: string
          period_start?: string
          previous_value?: number | null
          target_value?: number | null
          trend?: string | null
          trend_percent?: number | null
          unit?: string
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          archive_enabled: boolean | null
          archive_location: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_cleanup: string | null
          next_cleanup: string | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          archive_enabled?: boolean | null
          archive_location?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_cleanup?: string | null
          next_cleanup?: string | null
          retention_days: number
          table_name: string
          updated_at?: string
        }
        Update: {
          archive_enabled?: boolean | null
          archive_location?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_cleanup?: string | null
          next_cleanup?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_source_health: {
        Row: {
          avg_response_ms: number | null
          consecutive_failures: number | null
          created_at: string
          endpoint_url: string | null
          error_message: string | null
          id: string
          is_critical: boolean | null
          last_failed_sync: string | null
          last_successful_sync: string | null
          source_name: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          avg_response_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          is_critical?: boolean | null
          last_failed_sync?: string | null
          last_successful_sync?: string | null
          source_name: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          avg_response_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          is_critical?: boolean | null
          last_failed_sync?: string | null
          last_successful_sync?: string | null
          source_name?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_call_aggregates: {
        Row: {
          avg_response_time_minutes: number | null
          call_type: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          priority_high: number | null
          priority_low: number | null
          priority_medium: number | null
          suburb: string | null
          total_calls: number
          ward_id: number
        }
        Insert: {
          avg_response_time_minutes?: number | null
          call_type: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          priority_high?: number | null
          priority_low?: number | null
          priority_medium?: number | null
          suburb?: string | null
          total_calls?: number
          ward_id: number
        }
        Update: {
          avg_response_time_minutes?: number | null
          call_type?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          priority_high?: number | null
          priority_low?: number | null
          priority_medium?: number | null
          suburb?: string | null
          total_calls?: number
          ward_id?: number
        }
        Relationships: []
      }
      flight_status: {
        Row: {
          actual_time: string | null
          airline: string
          created_at: string
          flight_number: string
          flight_type: string
          gate: string | null
          id: string
          last_updated: string
          origin_destination: string
          scheduled_time: string
          status: string
          terminal: string | null
        }
        Insert: {
          actual_time?: string | null
          airline: string
          created_at?: string
          flight_number: string
          flight_type: string
          gate?: string | null
          id?: string
          last_updated?: string
          origin_destination: string
          scheduled_time: string
          status?: string
          terminal?: string | null
        }
        Update: {
          actual_time?: string | null
          airline?: string
          created_at?: string
          flight_number?: string
          flight_type?: string
          gate?: string | null
          id?: string
          last_updated?: string
          origin_destination?: string
          scheduled_time?: string
          status?: string
          terminal?: string | null
        }
        Relationships: []
      }
      geo_districts: {
        Row: {
          code: string | null
          created_at: string
          id: string
          municipality_type: string
          name: string
          region_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          municipality_type: string
          name: string
          region_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          municipality_type?: string
          name?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "geo_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_local_municipalities: {
        Row: {
          code: string | null
          created_at: string
          district_id: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          district_id: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          district_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_local_municipalities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "geo_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_regions: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      geo_suburbs: {
        Row: {
          boundary_geojson: Json | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          district_id: string | null
          id: string
          local_municipality_id: string | null
          name: string
          postcode: string
        }
        Insert: {
          boundary_geojson?: Json | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district_id?: string | null
          id?: string
          local_municipality_id?: string | null
          name: string
          postcode: string
        }
        Update: {
          boundary_geojson?: Json | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district_id?: string | null
          id?: string
          local_municipality_id?: string | null
          name?: string
          postcode?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_suburbs_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "geo_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_suburbs_local_municipality_id_fkey"
            columns: ["local_municipality_id"]
            isOneToOne: false
            referencedRelation: "geo_local_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_ward_suburbs: {
        Row: {
          coverage_percent: number | null
          created_at: string
          id: string
          suburb_id: string
          ward_id: string
        }
        Insert: {
          coverage_percent?: number | null
          created_at?: string
          id?: string
          suburb_id: string
          ward_id: string
        }
        Update: {
          coverage_percent?: number | null
          created_at?: string
          id?: string
          suburb_id?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_ward_suburbs_suburb_id_fkey"
            columns: ["suburb_id"]
            isOneToOne: false
            referencedRelation: "geo_suburbs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_ward_suburbs_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "geo_wards"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_wards: {
        Row: {
          boundary_geojson: Json | null
          created_at: string
          district_id: string | null
          id: string
          local_municipality_id: string | null
          ward_number: number
        }
        Insert: {
          boundary_geojson?: Json | null
          created_at?: string
          district_id?: string | null
          id?: string
          local_municipality_id?: string | null
          ward_number: number
        }
        Update: {
          boundary_geojson?: Json | null
          created_at?: string
          district_id?: string | null
          id?: string
          local_municipality_id?: string | null
          ward_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_wards_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "geo_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_wards_local_municipality_id_fkey"
            columns: ["local_municipality_id"]
            isOneToOne: false
            referencedRelation: "geo_local_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      health_facilities: {
        Row: {
          address: string | null
          created_at: string
          emergency_phone: string | null
          facility_type: string
          has_trauma_unit: boolean
          id: string
          is_24h: boolean
          latitude: number
          longitude: number
          name: string
          phone: string | null
          suburb: string | null
          updated_at: string
          ward_number: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          emergency_phone?: string | null
          facility_type: string
          has_trauma_unit?: boolean
          id?: string
          is_24h?: boolean
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          suburb?: string | null
          updated_at?: string
          ward_number?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          emergency_phone?: string | null
          facility_type?: string
          has_trauma_unit?: boolean
          id?: string
          is_24h?: boolean
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          suburb?: string | null
          updated_at?: string
          ward_number?: number | null
        }
        Relationships: []
      }
      hiking_trails: {
        Row: {
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          difficulty: string
          distance_km: number
          elevation_gain_m: number
          estimated_hours: number
          id: string
          is_open: boolean
          location: string
          name: string
          safety_notes: string | null
          sunrise_time: string | null
          sunset_time: string | null
        }
        Insert: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          difficulty: string
          distance_km: number
          elevation_gain_m?: number
          estimated_hours: number
          id?: string
          is_open?: boolean
          location: string
          name: string
          safety_notes?: string | null
          sunrise_time?: string | null
          sunset_time?: string | null
        }
        Update: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          difficulty?: string
          distance_km?: number
          elevation_gain_m?: number
          estimated_hours?: number
          id?: string
          is_open?: boolean
          location?: string
          name?: string
          safety_notes?: string | null
          sunrise_time?: string | null
          sunset_time?: string | null
        }
        Relationships: []
      }
      incident_assignments: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assigned_at: string
          assigned_by: string
          id: string
          incident_id: string
          note: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          unit_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_at?: string
          assigned_by: string
          id?: string
          incident_id: string
          note?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          unit_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          incident_id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignments_ack_by_fk"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incident_assignments_assigned_by_fk"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incident_assignments_incident_fk"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_assignments_unit_fk"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "responder_units"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_clusters: {
        Row: {
          category: string
          center_lat: number | null
          center_lng: number | null
          cluster_type: string
          created_at: string
          first_incident: string | null
          id: string
          incident_count: number
          is_active: boolean | null
          last_incident: string | null
          metadata: Json | null
          radius_meters: number | null
          severity: string | null
          time_window_hours: number | null
          updated_at: string
        }
        Insert: {
          category: string
          center_lat?: number | null
          center_lng?: number | null
          cluster_type: string
          created_at?: string
          first_incident?: string | null
          id?: string
          incident_count: number
          is_active?: boolean | null
          last_incident?: string | null
          metadata?: Json | null
          radius_meters?: number | null
          severity?: string | null
          time_window_hours?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          center_lat?: number | null
          center_lng?: number | null
          cluster_type?: string
          created_at?: string
          first_incident?: string | null
          id?: string
          incident_count?: number
          is_active?: boolean | null
          last_incident?: string | null
          metadata?: Json | null
          radius_meters?: number | null
          severity?: string | null
          time_window_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          priority: Database["public"]["Enums"]["incident_priority"]
          source_report_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incidents_source_report_fk"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "citizen_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_status: {
        Row: {
          area_code: string | null
          capacity_percent: number | null
          created_at: string
          estimated_restoration: string | null
          id: string
          incident_count_24h: number | null
          infrastructure_type: string
          last_incident: string | null
          last_updated: string
          municipality: string | null
          source: string
          status: string
          street: string | null
          suburb: string | null
          ward_id: number | null
          zone_code: string
          zone_name: string
        }
        Insert: {
          area_code?: string | null
          capacity_percent?: number | null
          created_at?: string
          estimated_restoration?: string | null
          id?: string
          incident_count_24h?: number | null
          infrastructure_type: string
          last_incident?: string | null
          last_updated?: string
          municipality?: string | null
          source?: string
          status?: string
          street?: string | null
          suburb?: string | null
          ward_id?: number | null
          zone_code: string
          zone_name: string
        }
        Update: {
          area_code?: string | null
          capacity_percent?: number | null
          created_at?: string
          estimated_restoration?: string | null
          id?: string
          incident_count_24h?: number | null
          infrastructure_type?: string
          last_incident?: string | null
          last_updated?: string
          municipality?: string | null
          source?: string
          status?: string
          street?: string | null
          suburb?: string | null
          ward_id?: number | null
          zone_code?: string
          zone_name?: string
        }
        Relationships: []
      }
      loadshedding_status: {
        Row: {
          area_code: string | null
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean
          last_updated: string
          source: string
          stage: number
          start_time: string | null
          suburb: string | null
        }
        Insert: {
          area_code?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          source?: string
          stage?: number
          start_time?: string | null
          suburb?: string | null
        }
        Update: {
          area_code?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          source?: string
          stage?: number
          start_time?: string | null
          suburb?: string | null
        }
        Relationships: []
      }
      neighborhood_ratings: {
        Row: {
          assault_count: number | null
          burglary_count: number | null
          created_at: string
          crime_count_30d: number | null
          crime_rate: string
          id: string
          last_updated: string
          latitude: number | null
          longitude: number | null
          neighborhood: string
          population_estimate: number | null
          robbery_count: number | null
          safety_score: number
          theft_count: number | null
        }
        Insert: {
          assault_count?: number | null
          burglary_count?: number | null
          created_at?: string
          crime_count_30d?: number | null
          crime_rate: string
          id?: string
          last_updated?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          population_estimate?: number | null
          robbery_count?: number | null
          safety_score: number
          theft_count?: number | null
        }
        Update: {
          assault_count?: number | null
          burglary_count?: number | null
          created_at?: string
          crime_count_30d?: number | null
          crime_rate?: string
          id?: string
          last_updated?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          population_estimate?: number | null
          robbery_count?: number | null
          safety_score?: number
          theft_count?: number | null
        }
        Relationships: []
      }
      ontology_entities: {
        Row: {
          created_at: string
          description: string | null
          entity_type_id: string
          external_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          properties: Json | null
          source: string | null
          source_timestamp: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_type_id: string
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          properties?: Json | null
          source?: string | null
          source_timestamp?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_type_id?: string
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          properties?: Json | null
          source?: string | null
          source_timestamp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_entities_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_entity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_entity_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          properties_schema: Json | null
          type_name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          properties_schema?: Json | null
          type_name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          properties_schema?: Json | null
          type_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ontology_lineage: {
        Row: {
          actor: string | null
          entity_id: string
          id: string
          new_state: Json | null
          operation: string
          previous_state: Json | null
          source_record_id: string | null
          source_system: string
          source_table: string | null
          timestamp: string
          transformation: string | null
        }
        Insert: {
          actor?: string | null
          entity_id: string
          id?: string
          new_state?: Json | null
          operation: string
          previous_state?: Json | null
          source_record_id?: string | null
          source_system: string
          source_table?: string | null
          timestamp?: string
          transformation?: string | null
        }
        Update: {
          actor?: string | null
          entity_id?: string
          id?: string
          new_state?: Json | null
          operation?: string
          previous_state?: Json | null
          source_record_id?: string | null
          source_system?: string
          source_table?: string | null
          timestamp?: string
          transformation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_lineage_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ontology_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_relationship_types: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          from_entity_type: string
          id: string
          is_bidirectional: boolean | null
          properties_schema: Json | null
          to_entity_type: string
          type_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          from_entity_type: string
          id?: string
          is_bidirectional?: boolean | null
          properties_schema?: Json | null
          to_entity_type: string
          type_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          from_entity_type?: string
          id?: string
          is_bidirectional?: boolean | null
          properties_schema?: Json | null
          to_entity_type?: string
          type_name?: string
        }
        Relationships: []
      }
      ontology_relationships: {
        Row: {
          confidence: number | null
          created_at: string
          from_entity_id: string
          id: string
          properties: Json | null
          relationship_type_id: string
          source: string | null
          to_entity_id: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          from_entity_id: string
          id?: string
          properties?: Json | null
          relationship_type_id: string
          source?: string | null
          to_entity_id: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          from_entity_id?: string
          id?: string
          properties?: Json | null
          relationship_type_id?: string
          source?: string | null
          to_entity_id?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "ontology_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_relationship_type_id_fkey"
            columns: ["relationship_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_relationship_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "ontology_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      responder_units: {
        Row: {
          callsign: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["unit_status"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          callsign?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["unit_status"]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          callsign?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["unit_status"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          computed_at: string
          created_at: string
          entity_id: string
          entity_name: string
          entity_type: string
          factors: Json | null
          id: string
          risk_category: string
          score: number
          trend: string | null
          valid_until: string | null
        }
        Insert: {
          computed_at?: string
          created_at?: string
          entity_id: string
          entity_name: string
          entity_type: string
          factors?: Json | null
          id?: string
          risk_category: string
          score: number
          trend?: string | null
          valid_until?: string | null
        }
        Update: {
          computed_at?: string
          created_at?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          factors?: Json | null
          id?: string
          risk_category?: string
          score?: number
          trend?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      running_routes: {
        Row: {
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          difficulty: string
          distance_km: number
          has_water_stations: boolean | null
          id: string
          is_lit: boolean | null
          is_open: boolean | null
          location: string
          name: string
          notes: string | null
          safety_rating: number | null
          terrain: string
        }
        Insert: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          difficulty?: string
          distance_km: number
          has_water_stations?: boolean | null
          id?: string
          is_lit?: boolean | null
          is_open?: boolean | null
          location: string
          name: string
          notes?: string | null
          safety_rating?: number | null
          terrain?: string
        }
        Update: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          difficulty?: string
          distance_km?: number
          has_water_stations?: boolean | null
          id?: string
          is_lit?: boolean | null
          is_open?: boolean | null
          location?: string
          name?: string
          notes?: string | null
          safety_rating?: number | null
          terrain?: string
        }
        Relationships: []
      }
      safe_zones: {
        Row: {
          address: string
          contact_number: string | null
          created_at: string
          id: string
          is_24_hours: boolean | null
          latitude: number
          longitude: number
          name: string
          neighborhood: string | null
          operating_hours: Json | null
          safety_rating: number | null
          updated_at: string
          verified: boolean | null
          zone_type: string
        }
        Insert: {
          address: string
          contact_number?: string | null
          created_at?: string
          id?: string
          is_24_hours?: boolean | null
          latitude: number
          longitude: number
          name: string
          neighborhood?: string | null
          operating_hours?: Json | null
          safety_rating?: number | null
          updated_at?: string
          verified?: boolean | null
          zone_type: string
        }
        Update: {
          address?: string
          contact_number?: string | null
          created_at?: string
          id?: string
          is_24_hours?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          neighborhood?: string | null
          operating_hours?: Json | null
          safety_rating?: number | null
          updated_at?: string
          verified?: boolean | null
          zone_type?: string
        }
        Relationships: []
      }
      safety_services: {
        Row: {
          address: string | null
          created_at: string
          emergency_phone: string | null
          id: number
          is_24h: boolean | null
          lat: number
          lng: number
          name: string
          phone: string | null
          type: string
          ward_number: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          emergency_phone?: string | null
          id?: number
          is_24h?: boolean | null
          lat: number
          lng: number
          name: string
          phone?: string | null
          type: string
          ward_number?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          emergency_phone?: string | null
          id?: number
          is_24h?: boolean | null
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          type?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_services_ward_number_fkey"
            columns: ["ward_number"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["ward_number"]
          },
        ]
      }
      saps_stations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_24h: boolean
          latitude: number
          longitude: number
          name: string
          phone: string | null
          station_code: string | null
          suburb: string | null
          updated_at: string
          ward_number: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_24h?: boolean
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          station_code?: string | null
          suburb?: string | null
          updated_at?: string
          ward_number?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_24h?: boolean
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          station_code?: string | null
          suburb?: string | null
          updated_at?: string
          ward_number?: number | null
        }
        Relationships: []
      }
      suburb_intelligence: {
        Row: {
          area_code: string
          cctv_coverage: number
          created_at: string
          esp_area_id: string | null
          fire_contact: string
          fire_station: string
          hospital_contact: string
          hospital_name: string
          id: string
          incidents_24h: number
          risk_type: string | null
          safety_score: number
          saps_contact: string
          saps_station: string
          suburb_name: string
          updated_at: string
          ward_id: number
        }
        Insert: {
          area_code: string
          cctv_coverage?: number
          created_at?: string
          esp_area_id?: string | null
          fire_contact: string
          fire_station: string
          hospital_contact: string
          hospital_name: string
          id: string
          incidents_24h?: number
          risk_type?: string | null
          safety_score: number
          saps_contact: string
          saps_station: string
          suburb_name: string
          updated_at?: string
          ward_id: number
        }
        Update: {
          area_code?: string
          cctv_coverage?: number
          created_at?: string
          esp_area_id?: string | null
          fire_contact?: string
          fire_station?: string
          hospital_contact?: string
          hospital_name?: string
          id?: string
          incidents_24h?: number
          risk_type?: string | null
          safety_score?: number
          saps_contact?: string
          saps_station?: string
          suburb_name?: string
          updated_at?: string
          ward_id?: number
        }
        Relationships: []
      }
      traffic_signals: {
        Row: {
          area_code: string | null
          controller_type: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          id: string
          intersection_type: string | null
          is_synchronized: boolean | null
          last_maintenance: string | null
          location: string
          municipality: string | null
          name: string
          signal_code: string
          status: string
          street: string | null
          suburb: string | null
          updated_at: string
          ward_id: number | null
        }
        Insert: {
          area_code?: string | null
          controller_type?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          id?: string
          intersection_type?: string | null
          is_synchronized?: boolean | null
          last_maintenance?: string | null
          location: string
          municipality?: string | null
          name: string
          signal_code: string
          status?: string
          street?: string | null
          suburb?: string | null
          updated_at?: string
          ward_id?: number | null
        }
        Update: {
          area_code?: string | null
          controller_type?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          id?: string
          intersection_type?: string | null
          is_synchronized?: boolean | null
          last_maintenance?: string | null
          location?: string
          municipality?: string | null
          name?: string
          signal_code?: string
          status?: string
          street?: string | null
          suburb?: string | null
          updated_at?: string
          ward_id?: number | null
        }
        Relationships: []
      }
      train_routes: {
        Row: {
          created_at: string
          id: string
          incidents_24h: number
          is_operational: boolean
          last_updated: string
          name: string
          operating_cameras: number
          route_code: string
          safety_score: number
          stations: number
          status: string
          total_cameras: number
        }
        Insert: {
          created_at?: string
          id?: string
          incidents_24h?: number
          is_operational?: boolean
          last_updated?: string
          name: string
          operating_cameras?: number
          route_code: string
          safety_score?: number
          stations?: number
          status?: string
          total_cameras?: number
        }
        Update: {
          created_at?: string
          id?: string
          incidents_24h?: number
          is_operational?: boolean
          last_updated?: string
          name?: string
          operating_cameras?: number
          route_code?: string
          safety_score?: number
          stations?: number
          status?: string
          total_cameras?: number
        }
        Relationships: []
      }
      unit_members: {
        Row: {
          created_at: string
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_members_unit_fk"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "responder_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_members_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      unit_status_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          set_by: string
          status: Database["public"]["Enums"]["unit_status"]
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          set_by: string
          status: Database["public"]["Enums"]["unit_status"]
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          set_by?: string
          status?: Database["public"]["Enums"]["unit_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_status_events_set_by_fk"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "unit_status_events_unit_fk"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "responder_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wards: {
        Row: {
          created_at: string
          district: string | null
          geojson: Json | null
          id: number
          incident_count: number | null
          lat: number | null
          lng: number | null
          safety_score: number | null
          suburb: string | null
          ward_name: string | null
          ward_number: number
        }
        Insert: {
          created_at?: string
          district?: string | null
          geojson?: Json | null
          id?: number
          incident_count?: number | null
          lat?: number | null
          lng?: number | null
          safety_score?: number | null
          suburb?: string | null
          ward_name?: string | null
          ward_number: number
        }
        Update: {
          created_at?: string
          district?: string | null
          geojson?: Json | null
          id?: number
          incident_count?: number | null
          lat?: number | null
          lng?: number | null
          safety_score?: number | null
          suburb?: string | null
          ward_name?: string | null
          ward_number?: number
        }
        Relationships: []
      }
      water_outages: {
        Row: {
          area_description: string
          created_at: string
          estimated_end_time: string | null
          id: string
          is_active: boolean
          outage_type: string
          start_time: string
          suburb: string
          updated_at: string
        }
        Insert: {
          area_description: string
          created_at?: string
          estimated_end_time?: string | null
          id?: string
          is_active?: boolean
          outage_type?: string
          start_time?: string
          suburb: string
          updated_at?: string
        }
        Update: {
          area_description?: string
          created_at?: string
          estimated_end_time?: string | null
          id?: string
          is_active?: boolean
          outage_type?: string
          start_time?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: []
      }
      water_status: {
        Row: {
          capacity_ml: number
          created_at: string
          current_level: number
          dam_code: string
          dam_name: string
          id: string
          last_updated: string
          status: string
        }
        Insert: {
          capacity_ml: number
          created_at?: string
          current_level?: number
          dam_code: string
          dam_name: string
          id?: string
          last_updated?: string
          status?: string
        }
        Update: {
          capacity_ml?: number
          created_at?: string
          current_level?: number
          dam_code?: string
          dam_name?: string
          id?: string
          last_updated?: string
          status?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          created_at: string
          description: string | null
          feels_like_celsius: number | null
          humidity_percent: number | null
          icon_code: string | null
          id: string
          last_updated: string
          location: string
          temperature_celsius: number | null
          uv_index: number | null
          visibility_km: number | null
          wind_direction: string | null
          wind_speed_kmh: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          feels_like_celsius?: number | null
          humidity_percent?: number | null
          icon_code?: string | null
          id?: string
          last_updated?: string
          location?: string
          temperature_celsius?: number | null
          uv_index?: number | null
          visibility_km?: number | null
          wind_direction?: string | null
          wind_speed_kmh?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          feels_like_celsius?: number | null
          humidity_percent?: number | null
          icon_code?: string | null
          id?: string
          last_updated?: string
          location?: string
          temperature_celsius?: number | null
          uv_index?: number | null
          visibility_km?: number | null
          wind_direction?: string | null
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
      wildfire_alerts: {
        Row: {
          alert_id: string
          created_at: string
          event_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          event_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wildfire_alerts_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alert_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wildfire_alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "wildfire_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wildfire_events: {
        Row: {
          created_at: string
          detected_at: string
          external_id: string | null
          id: string
          intensity: number | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          severity: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detected_at?: string
          external_id?: string | null
          id?: string
          intensity?: number | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          severity?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detected_at?: string
          external_id?: string | null
          id?: string
          intensity?: number | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          severity?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wildfire_perimeters: {
        Row: {
          area_ha: number | null
          created_at: string
          event_id: string
          id: string
          perimeter_geojson: Json
          updated_at: string
        }
        Insert: {
          area_ha?: number | null
          created_at?: string
          event_id: string
          id?: string
          perimeter_geojson: Json
          updated_at?: string
        }
        Update: {
          area_ha?: number | null
          created_at?: string
          event_id?: string
          id?: string
          perimeter_geojson?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wildfire_perimeters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wildfire_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wind_reports: {
        Row: {
          advisory: string | null
          affects_beach_goers: boolean
          affects_drivers: boolean
          affects_hikers: boolean
          affects_surfers: boolean
          created_at: string
          description: string | null
          id: string
          last_updated: string
          location: string
          severity: string
          wind_direction: string
          wind_gust_kmh: number | null
          wind_speed_kmh: number
        }
        Insert: {
          advisory?: string | null
          affects_beach_goers?: boolean
          affects_drivers?: boolean
          affects_hikers?: boolean
          affects_surfers?: boolean
          created_at?: string
          description?: string | null
          id?: string
          last_updated?: string
          location: string
          severity?: string
          wind_direction: string
          wind_gust_kmh?: number | null
          wind_speed_kmh: number
        }
        Update: {
          advisory?: string | null
          affects_beach_goers?: boolean
          affects_drivers?: boolean
          affects_hikers?: boolean
          affects_surfers?: boolean
          created_at?: string
          description?: string | null
          id?: string
          last_updated?: string
          location?: string
          severity?: string
          wind_direction?: string
          wind_gust_kmh?: number | null
          wind_speed_kmh?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      any_admin_exists: { Args: never; Returns: boolean }
      claim_initial_admin: { Args: never; Returns: boolean }
      get_entity_neighborhood: {
        Args: { p_entity_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          direction: string
          entity_id: string
          entity_name: string
          entity_type: string
          relationship_type: string
        }[]
      }
      get_entity_stats: {
        Args: never
        Returns: {
          active_count: number
          color: string
          display_name: string
          entity_count: number
          icon: string
          last_updated: string
          type_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_unit_member: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      refresh_ontology_views: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "dispatcher" | "responder"
      assignment_status:
        | "assigned"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status: "new" | "triaged" | "dispatched" | "resolved" | "closed"
      unit_status:
        | "available"
        | "enroute"
        | "on_scene"
        | "transporting"
        | "unavailable"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dispatcher", "responder"],
      assignment_status: [
        "assigned",
        "accepted",
        "declined",
        "completed",
        "cancelled",
      ],
      incident_priority: ["low", "medium", "high", "critical"],
      incident_status: ["new", "triaged", "dispatched", "resolved", "closed"],
      unit_status: [
        "available",
        "enroute",
        "on_scene",
        "transporting",
        "unavailable",
      ],
    },
  },
} as const
