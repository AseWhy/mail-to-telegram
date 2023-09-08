import { ProviderData } from "./ProviderData";

export abstract class BasePool<T> {
    abstract get ready(): boolean;
    abstract pull(): Promise<ProviderData<T>[]>;
}
