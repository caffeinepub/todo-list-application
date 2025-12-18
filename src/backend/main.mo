import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import Int "mo:core/Int";

actor {
  type TaskId = Nat32;
  type Timestamp = Time.Time;

  type Task = {
    id : TaskId;
    title : Text;
    completed : Bool;
    dueDate : ?Timestamp;
  };

  module Task {
    public func compareByDueDate(task1 : Task, task2 : Task) : Order.Order {
      let dueDateResult = switch (task1.dueDate, task2.dueDate) {
        case (null, null) { #equal };
        case (null, ?_) { #greater };
        case (?_, null) { #less };
        case (?date1, ?date2) { Int.compare(date1, date2) };
      };

      switch (dueDateResult) {
        case (#equal) { compareTitle(task1, task2) };
        case (result) { result };
      };
    };

    func compareTitle(task1 : Task, task2 : Task) : Order.Order {
      Text.compare(task1.title, task2.title);
    };
  };

  let tasks = Map.empty<TaskId, Task>();
  var nextTaskId = 0;
  func getNextTaskId() : TaskId {
    let id = Nat32.fromNat(nextTaskId);
    nextTaskId += 1;
    id;
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    tasks.values().toArray().sort(Task.compareByDueDate);
  };

  public shared ({ caller }) func addTask(title : Text, dueDate : ?Timestamp) : async TaskId {
    if (title.isEmpty()) { Runtime.trap("Title cannot be empty") };

    let id = getNextTaskId();

    let task : Task = {
      id;
      title;
      completed = false;
      dueDate;
    };

    tasks.add(id, task);
    id;
  };

  public shared ({ caller }) func updateTask(id : TaskId, title : Text, dueDate : ?Timestamp, completed : Bool) : async () {
    if (title.isEmpty()) { Runtime.trap("Title cannot be empty") };

    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?_) {
        let updatedTask : Task = {
          id;
          title;
          completed;
          dueDate;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : TaskId) : async () {
    if (not tasks.containsKey(id)) { Runtime.trap("Task not found") };
    tasks.remove(id);
  };

  public shared ({ caller }) func toggleTaskCompletion(id : TaskId) : async () {
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        let updatedTask : Task = {
          id = task.id;
          title = task.title;
          completed = not task.completed;
          dueDate = task.dueDate;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public query ({ caller }) func getActiveTasks() : async [Task] {
    tasks.values().filter(func(task) { not task.completed }).toArray().sort(Task.compareByDueDate);
  };

  public query ({ caller }) func getCompletedTasks() : async [Task] {
    tasks.values().filter(func(task) { task.completed }).toArray().sort(Task.compareByDueDate);
  };

  public query ({ caller }) func getOverdueTasks() : async [Task] {
    let now = Time.now();
    tasks.values().filter(
      func(task) {
        switch (task.dueDate) {
          case (?due) { not task.completed and due < now };
          case (null) { false };
        };
      }
    ).toArray().sort(Task.compareByDueDate);
  };

  public query ({ caller }) func getTaskById(id : TaskId) : async Task {
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
  };
};
