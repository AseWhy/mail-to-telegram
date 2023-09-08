import { ProviderData } from "./ProviderData";

export abstract class BaseHandler<T> {
    public abstract get type(): string;
    public abstract handle(data: ProviderData<T>[]): Promise<void>;
}
