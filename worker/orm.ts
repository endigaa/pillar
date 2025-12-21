import { IndexedEntity, Entity } from "./core-utils";
import type { Env } from "./core-utils";
export function createModel<S extends { id: string }, T extends IndexedEntity<S>>(EntityClass: new (env: Env, id: string) => T) {
  return {
    /**
     * Retrieve all items for this model.
     */
    all: async (env: Env): Promise<S[]> => {
      const { items } = await (EntityClass as any).list(env);
      return items as S[];
    },
    /**
     * Find an item by its ID. Returns the entity instance.
     */
    findInstance: async (env: Env, id: string): Promise<T | null> => {
      const instance = new EntityClass(env, id);
      if (await instance.exists()) {
        return instance;
      }
      return null;
    },
    /**
     * Find an item by its ID. Returns the plain state object.
     */
    find: async (env: Env, id: string): Promise<S | null> => {
        const instance = new EntityClass(env, id);
        if (await instance.exists()) {
            return instance.getState();
        }
        return null;
    },
    /**
     * Create a new item.
     */
    create: async (env: Env, data: S): Promise<S> => {
      return await (EntityClass as any).create(env, data) as S;
    },
    /**
     * Delete an item by its ID.
     */
    delete: async (env: Env, id: string): Promise<boolean> => {
      return (EntityClass as any).delete(env, id);
    },
    /**
     * Ensure seed data is present.
     */
    ensureSeed: async (env: Env): Promise<void> => {
        await (EntityClass as any).ensureSeed(env);
    }
  };
}
// Singleton Entity Model Creator
type SingletonEntityClass<S> = typeof Entity<S> & {
    get(env: Env): Entity<S>;
    ensureSeed(env: Env): Promise<void>;
};
export function createSingletonModel<S>(Entity: SingletonEntityClass<S>) {
    return {
        get: async (env: Env): Promise<S> => {
            const instance = Entity.get(env);
            return instance.getState();
        },
        update: async (env: Env, data: S): Promise<S> => {
            const instance = Entity.get(env);
            await instance.save(data);
            return data;
        },
        ensureSeed: async (env: Env): Promise<void> => {
            await Entity.ensureSeed(env);
        }
    }
}