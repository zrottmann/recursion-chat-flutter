# SlumLord Project Consolidation Plan

## Target Directory Structure: `SlumLord/`

```
SlumLord/
├── package.json                    # Root workspace configuration
├── docker-compose.yml             # Multi-service orchestration
├── README.md                       # Consolidated documentation
├── docs/                          # Combined documentation
├── shared/                        # Shared resources
│   ├── database/
│   │   └── schema.js
│   ├── assets/                    # Common game assets
│   └── config/                    # Shared configurations
├── mobile/                        # React Native implementation
│   ├── expo/                      # Expo-based mobile (from slumlord-rpg-mobile)
│   └── rn-standard/              # Standard RN implementation (from main projects)
├── web/                          # Web implementations
│   ├── rpg-js/                   # RPG.js + Appwrite implementation
│   └── docs/                     # Web-specific documentation
├── flutter/                      # Flutter implementation
│   └── slumlord-game/           # Complete Flutter game
├── unity/                        # Unity implementation
│   └── (placeholder files)
├── multiplayer/                  # Websocket multiplayer backend
│   ├── shard-manager/
│   ├── game-shard/
│   └── client-example/
└── scripts/                     # Build and deployment scripts
```

## Consolidation Strategy

### Phase 1: Create Base Structure
- Create new `SlumLord/` directory
- Set up root package.json with workspace configuration
- Copy shared resources and documentation

### Phase 2: Mobile Platform Consolidation  
- **Target**: `SlumLord/mobile/`
- **Sources**: 
  - `slumlord/mobile/` → `SlumLord/mobile/rn-standard/`
  - `slumlord-rpg-mobile/` → `SlumLord/mobile/expo/`
- **Strategy**: Keep both implementations as they serve different use cases

### Phase 3: Web Platform Consolidation
- **Target**: `SlumLord/web/rpg-js/`
- **Primary Source**: `slumlord/web/appwrite-deployment/`
- **Secondary Source**: `slumlord-unified/web/appwrite-deployment/`
- **Key Merge Points**:
  - Environmental asset system from slumlord-unified
  - All core RPG systems from slumlord
  - Documentation from both projects

### Phase 4: Flutter Platform
- **Target**: `SlumLord/flutter/slumlord-game/`
- **Source**: `slumlord/flutter/slumlord-game/`
- **Note**: Only exists in main slumlord project

### Phase 5: Multiplayer Backend
- **Target**: `SlumLord/multiplayer/`
- **Sources**: Both projects have identical multiplayer structure
- **Strategy**: Use slumlord version as primary, validate against slumlord-unified

### Phase 6: Configuration Integration
- Merge package.json files for optimal workspace setup
- Consolidate Docker configurations
- Update build scripts and deployment workflows

## File Conflict Resolution Strategy

### High Priority Merges:
1. **Environmental Assets**: Integrate unique TerrainGenerator/TextureGenerator from slumlord-unified
2. **Package Dependencies**: Merge all unique dependencies from all projects
3. **Documentation**: Combine all README files and documentation

### Conflicts to Resolve:
1. **package.json versions**: Use highest version numbers
2. **Duplicate components**: Compare and merge best features
3. **Configuration files**: Merge environment configurations

## Implementation Approach:
1. Use `slumlord/` as the primary base (most complete)
2. Selectively merge unique components from `slumlord-unified/`
3. Add `slumlord-rpg-mobile/` as separate mobile implementation
4. Skip empty `rpg-js-appwrite/` directory

## Success Criteria:
- All unique functionality preserved
- No broken dependencies or imports
- Working build processes for all platforms
- Consolidated documentation
- Single workspace for development