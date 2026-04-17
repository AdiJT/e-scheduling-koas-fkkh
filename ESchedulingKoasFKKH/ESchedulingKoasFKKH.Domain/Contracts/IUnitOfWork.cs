using ESchedulingKoasFKKH.Domain.Shared;

namespace ESchedulingKoasFKKH.Domain.Contracts;

public interface IUnitOfWork
{
    Task<Result> SaveChangesAsync(CancellationToken cancellationToken = default);
}
