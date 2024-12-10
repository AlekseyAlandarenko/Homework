interface Task {
  id: number;
  date: string;
  title: string;
}

class TaskList {
  private tasks: Task[] = [];

  public addTask(task: Task): void {
    if (!this.validateTask(task)) {
      throw new Error("Задача невалидна. Убедитесь, что все поля заполнены корректно.");
    }

    task.date = this.formatDate(task.date);
    this.tasks.push(task);
  }

  public getTasks(): Task[] {
    return this.tasks;
  }

  public count(): number {
    return this.tasks.length;
  }

  public getIterator(type: "id" | "date", order: "asc" | "desc"): TaskIterator {
    return new TaskIterator(this.tasks, type, order);
  }

  private validateTask(task: Task): boolean {
    if (typeof task.id !== "number" || task.id <= 0) {
      console.error(`Неверный id: ${task.id}`);
      return false;
    }

    if (!this.isValidDate(task.date)) {
      console.error(`Неверная дата: ${task.date}`);
      return false;
    }

    if (typeof task.title !== "string" || task.title.trim() === "") {
      console.error(`Неверный заголовок: "${task.title}"`);
      return false;
    }

    return true;
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(this.convertToISODate(date));
    return !isNaN(parsedDate.getTime());
  }

  private formatDate(date: string): string {
    const parsedDate = new Date(this.convertToISODate(date));
    const day = (parsedDate.getDate() < 10 ? "0" : "") + parsedDate.getDate();
    const month = (parsedDate.getMonth() + 1 < 10 ? "0" : "") + (parsedDate.getMonth() + 1);
    const year = parsedDate.getFullYear();
    return day + "-" + month + "-" + year;
}

private convertToISODate(date: string): string {
    const parts = date.split("-");
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    const paddedMonth = (month < 10 ? "0" : "") + month;
    const paddedDay = (day < 10 ? "0" : "") + day

    return year + "-" + paddedMonth + "-" + paddedDay;
}
}

interface IIterator<T> {
  current(): T | undefined;
  next(): T | undefined;
  prev(): T | undefined;
  index(): number;
}

class TaskIterator implements IIterator<Task> {
  private position: number = 0;
  private tasks: Task[];

  constructor(tasks: Task[], type: "id" | "date", order: "asc" | "desc") {
    this.tasks = [...tasks];
    if (type === "id") {
      this.sortById(order);
    } else {
      this.sortByDate(order);
    }
  }

  private sortById(order: "asc" | "desc"): void {
    this.tasks.sort((a, b) => {
      return order === "asc" ? a.id - b.id : b.id - a.id;
    });
  }

  private sortByDate(order: "asc" | "desc"): void {
    this.tasks.sort((a, b) => {
      const dateA = new Date(a.date.split("-").reverse().join("-"));
      const dateB = new Date(b.date.split("-").reverse().join("-"));
      return order === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  }

  current(): Task | undefined {
    return this.tasks[this.position];
  }

  next(): Task | undefined {
    if (this.position < this.tasks.length - 1) {
      this.position += 1;
      return this.tasks[this.position];
    }
    return undefined;
  }

  prev(): Task | undefined {
    if (this.position > 0) {
      this.position -= 1;
      return this.tasks[this.position];
    }
    return undefined;
  }

  index(): number {
    return this.position;
  }
}