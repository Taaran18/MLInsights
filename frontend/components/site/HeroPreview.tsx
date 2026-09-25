import { Crown, Trophy } from "lucide-react";

const RESULTS = [
  {
    model: "Support Vector Classifier (RBF)",
    accuracy: 96.67,
    f1: 96.66,
    time: "18 ms",
  },
  {
    model: "Gradient Boosting Classifier",
    accuracy: 96.67,
    f1: 96.66,
    time: "410 ms",
  },
  { model: "Logistic Regression", accuracy: 93.33, f1: 93.33, time: "58 ms" },
  {
    model: "K-Nearest Neighbors Classifier",
    accuracy: 93.33,
    f1: 93.27,
    time: "12 ms",
  },
  { model: "XGBoost Classifier", accuracy: 93.33, f1: 93.33, time: "832 ms" },
];

export function HeroPreview() {
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 text-left shadow-pop backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2/70 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </span>
        <span className="truncate text-xs font-medium text-fg-muted sm:text-sm">
          Compare Models · iris.csv · Classification
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_16rem]">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="data-table sm:min-w-136">
            <caption className="sr-only">
              Example leaderboard from training five models on the Iris sample
              dataset
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  #
                </th>
                <th scope="col">Model</th>
                <th scope="col" className="text-right">
                  Accuracy
                </th>
                <th scope="col" className="hidden text-right sm:table-cell">
                  F1 Score
                </th>
                <th scope="col" className="hidden text-right sm:table-cell">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((row, index) => (
                <tr key={row.model}>
                  <td className="num text-fg-subtle">{index + 1}</td>
                  <td className="font-medium text-fg sm:whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {index === 0 ? (
                        <Crown
                          className="size-4 text-amber-500"
                          aria-label="Top model"
                        />
                      ) : null}
                      {row.model}
                    </span>
                  </td>
                  <td className="num text-right">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-surface-3 sm:inline-block">
                        <span
                          className="block h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500"
                          style={{ width: `${row.accuracy}%` }}
                        />
                      </span>
                      <span
                        className={
                          index < 2 ? "font-semibold text-success" : "text-fg"
                        }
                      >
                        {row.accuracy.toFixed(2)}%
                      </span>
                    </span>
                  </td>
                  <td className="num hidden text-right text-fg sm:table-cell">
                    {row.f1.toFixed(2)}%
                  </td>
                  <td className="num hidden text-right text-fg-muted sm:table-cell">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-bg-alt p-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">
              <Trophy className="size-4 text-amber-500" aria-hidden="true" />
              Best Model
            </p>
            <p className="mt-3 text-lg leading-snug font-bold text-fg">
              Support Vector Classifier
            </p>
            <p className="num mt-1 text-3xl font-extrabold tracking-tight text-success">
              96.67%
            </p>
            <p className="text-xs text-fg-subtle">
              accuracy on 30 held-out rows
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-surface p-3">
              <dt className="text-xs text-fg-subtle">Rows</dt>
              <dd className="num font-semibold text-fg">150</dd>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <dt className="text-xs text-fg-subtle">CV Mean</dt>
              <dd className="num font-semibold text-fg">96.67%</dd>
            </div>
          </dl>
        </div>
      </div>
      <figcaption className="border-t border-border px-4 py-2.5 text-center text-xs text-fg-subtle sm:px-6">
        Real results from the bundled Iris sample dataset, standard scaling, 20%
        test split.
      </figcaption>
    </figure>
  );
}
