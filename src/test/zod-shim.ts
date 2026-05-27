type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; error: Error };

type Shape = Record<string, ZodTypeAny>;

class ZodType<T = unknown> {
  safeParse(data: unknown): ParseSuccess<T> | ParseFailure {
    return { success: true, data: data as T };
  }

  parse(data: unknown): T {
    return data as T;
  }

  optional(): ZodType<T | undefined> {
    return this as unknown as ZodType<T | undefined>;
  }

  default(_value: unknown): ZodType<T> {
    return this;
  }

  url(): ZodType<T> {
    return this;
  }

  datetime(): ZodType<T> {
    return this;
  }

  positive(): ZodType<T> {
    return this;
  }

  nonnegative(): ZodType<T> {
    return this;
  }

  int(): ZodType<T> {
    return this;
  }

  min(_value: number): ZodType<T> {
    return this;
  }

  max(_value: number): ZodType<T> {
    return this;
  }

  regex(_value: RegExp): ZodType<T> {
    return this;
  }
}

type ZodTypeAny = ZodType<unknown>;
type Infer<T> = T extends ZodType<infer U> ? U : unknown;
type InferObject<TShape extends Shape> = {
  [K in keyof TShape]: Infer<TShape[K]>;
};

class ZodObject<TShape extends Shape> extends ZodType<InferObject<TShape>> {
  constructor(private readonly shape: TShape) {
    super();
  }

  safeParse(data: unknown): ParseSuccess<InferObject<TShape>> | ParseFailure {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { success: false, error: new Error('Expected object') };
    }
    return { success: true, data: data as InferObject<TShape> };
  }
}

class ZodArray<TItem extends ZodTypeAny> extends ZodType<Array<Infer<TItem>>> {
  constructor(private readonly item: TItem) {
    super();
  }

  safeParse(data: unknown): ParseSuccess<Array<Infer<TItem>>> | ParseFailure {
    if (!Array.isArray(data)) {
      return { success: false, error: new Error('Expected array') };
    }
    return { success: true, data: data as Array<Infer<TItem>> };
  }
}

class ZodEnum<TValues extends readonly [string, ...string[]]> extends ZodType<TValues[number]> {
  constructor(private readonly values: TValues) {
    super();
  }

  safeParse(data: unknown): ParseSuccess<TValues[number]> | ParseFailure {
    if (typeof data === 'string' && this.values.includes(data)) {
      return { success: true, data };
    }
    return { success: false, error: new Error('Expected enum value') };
  }
}

export class ZodError extends Error {}

export const z = {
  object: <TShape extends Shape>(shape: TShape) => new ZodObject(shape),
  string: () => new ZodType<string>(),
  number: () => new ZodType<number>(),
  boolean: () => new ZodType<boolean>(),
  unknown: () => new ZodType<unknown>(),
  array: <TItem extends ZodTypeAny>(item: TItem) => new ZodArray(item),
  enum: <TValues extends readonly [string, ...string[]]>(values: TValues) => new ZodEnum(values),
  record: (_valueType: ZodTypeAny) => new ZodType<Record<string, unknown>>(),
};

export namespace z {
  export type infer<T extends ZodTypeAny> = Infer<T>;
  export type ZodError = Error;
}

export default z;
