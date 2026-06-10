export abstract class Handler <T,U> {
    private next?: Handler<T,U>;

    setNext(handler: Handler<T,U>): Handler<T,U> {
        this.next = handler;
        return this;
    }

    async handle(condition: T, execution: U): Promise<void> {
        if(await this.canHandle(condition)){
            await this.process(execution);
        }
        else {
            await this.next?.handle(condition, execution);
        }
    }

    protected abstract canHandle(t: T): Promise<boolean>;
    protected abstract process(execution: U): Promise<void>;
 } 