//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/threading.ts
// Threading Information - FFI functions for managing and executing tasks in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Executes a number of DuckDB tasks on the current thread.
   * 
   * Tasks are small units of work scheduled by DuckDB, and this function will run them until the specified
   * maximum number of tasks is reached, or if there are no more tasks left to execute.
   * 
   * @param database The DuckDB database object for which to execute tasks.
   * @param max_tasks The maximum number of tasks to execute. The function will return once this number of tasks is completed, or if no tasks remain.
   * @returns void
   */
  duckdb_execute_tasks: {
    parameters: ["pointer", "u64"] as const,  // duckdb_database, idx_t (uint64_t)
    result: "void" as const,                  // void
  },

  /**
   * Creates a new task state for managing task execution.
   * 
   * The created task state can be used with `duckdb_execute_tasks_state` to manage task execution across threads.
   * The returned task state must be destroyed using `duckdb_destroy_task_state` once it is no longer needed.
   * 
   * @param database The DuckDB database object for which to create the task state.
   * @returns A pointer to the newly created task state (`duckdb_task_state`).
   */
  duckdb_create_task_state: {
    parameters: ["pointer"] as const,         // duckdb_database
    result: "pointer" as const,               // duckdb_task_state
  },

  /**
   * Executes DuckDB tasks indefinitely on the current thread until `duckdb_finish_execution` is called on the task state.
   * 
   * Multiple threads can share the same task state for concurrent execution.
   * 
   * @param state The task state to use for executing tasks.
   * @returns void
   */
  duckdb_execute_tasks_state: {
    parameters: ["pointer"] as const,         // duckdb_task_state
    result: "void" as const,                  // void
  },

  /**
   * Executes a specified number of DuckDB tasks on the current thread using the provided task state.
   * 
   * The thread will stop executing tasks when either the specified maximum number of tasks has been executed,
   * `duckdb_finish_execution` is called, or if no more tasks remain. Multiple threads can share the same task state for concurrent execution.
   * 
   * @param state The task state to use for executing tasks.
   * @param max_tasks The maximum number of tasks to execute before stopping.
   * @returns The actual number of tasks that were executed (`idx_t`).
   */
  duckdb_execute_n_tasks_state: {
    parameters: ["pointer", "u64"] as const,  // duckdb_task_state, idx_t (uint64_t)
    result: "u64" as const,                   // idx_t (uint64_t)
  },

  /**
   * Signals the completion of task execution on the provided task state.
   * 
   * After calling this function, `duckdb_execute_tasks_state` will stop executing tasks.
   * 
   * @param state The task state to signal task completion.
   * @returns void
   */
  duckdb_finish_execution: {
    parameters: ["pointer"] as const,         // duckdb_task_state
    result: "void" as const,                  // void
  },

  /**
   * Checks whether task execution on the provided task state has been finished.
   * 
   * This function returns `true` if execution has been finished, and `false` otherwise.
   * 
   * @param state The task state to check.
   * @returns `true` if execution has been finished, `false` otherwise.
   */
  duckdb_task_state_is_finished: {
    parameters: ["pointer"] as const,         // duckdb_task_state
    result: "bool" as const,                  // bool
  },

  /**
   * Destroys a task state and deallocates any resources associated with it.
   * 
   * This should only be called once all tasks have finished executing and no active `duckdb_execute_tasks_state`
   * calls are using the task state.
   * 
   * @param state The task state to destroy.
   * @returns void
   */
  duckdb_destroy_task_state: {
    parameters: ["pointer"] as const,         // duckdb_task_state
    result: "void" as const,                  // void
  },

  /**
   * Checks if the execution of the current query on the specified connection is finished.
   * 
   * This function returns `true` if the query execution is complete, and `false` otherwise.
   * 
   * @param con The DuckDB connection object to check.
   * @returns `true` if query execution is finished, `false` otherwise.
   */
  duckdb_execution_is_finished: {
    parameters: ["pointer"] as const,         // duckdb_connection
    result: "bool" as const,                  // bool
  },
};
